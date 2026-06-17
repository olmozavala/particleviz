"""Encode and decode ParticleViz binary trajectory chunks."""

from typing import Optional, Tuple
import struct

import numpy as np


def experiment_slug(name: str) -> str:
    """Convert an experiment display name into a filesystem-safe folder slug.

    Args:
        name: Human-readable experiment name from the config file.

    Returns:
        Lowercase slug with spaces replaced by underscores.
    """
    return name.strip().lower().replace(" ", "_")


def format_header(
    num_particles: int,
    timesteps: int,
    start_date: str,
    time_unit: str,
    delta_t: float,
    has_nans: bool,
    ragged: bool,
) -> str:
    """Build the single-line text header for a binary chunk file.

    Args:
        num_particles: Number of particles in the subsampled dataset.
        timesteps: Number of timesteps stored in this chunk.
        start_date: ISO-like simulation start timestamp.
        time_unit: Time unit string (for example ``seconds``).
        delta_t: Time step magnitude in ``time_unit``.
        has_nans: Whether the source data contains missing positions.
        ragged: Whether the binary payload uses the ragged sparse layout.

    Returns:
        Header line terminated by a newline.
    """
    return (
        f"{num_particles}, {timesteps}, {start_date}, "
        f"{time_unit}, {delta_t}, {has_nans}, {ragged}\n"
    )


def parse_header(header_line: str) -> Tuple[int, int, str, str, float, bool, bool]:
    """Parse a ParticleViz header line into typed fields.

    Args:
        header_line: Raw header text, with or without trailing newline.

    Returns:
        Tuple of ``(num_particles, timesteps, start_date, time_unit, delta_t,
        has_nans, ragged)``. Legacy six-field headers default ``ragged`` to
        ``False``.
    """
    parts = [part.strip() for part in header_line.strip().split(",")]
    if len(parts) < 6:
        raise ValueError(f"Invalid ParticleViz header: {header_line!r}")

    ragged = False
    if len(parts) >= 7:
        ragged = parts[6].lower() == "true"

    return (
        int(parts[0]),
        int(parts[1]),
        parts[2],
        parts[3],
        float(parts[4]),
        parts[5].lower() == "true",
        ragged,
    )


def encode_dense_chunk(
    lat_chunk: np.ndarray,
    lon_chunk: np.ndarray,
    visible_mask: Optional[np.ndarray] = None,
) -> bytes:
    """Encode a dense particle-by-timestep binary chunk.

    Args:
        lat_chunk: Latitude values with shape ``(particles, timesteps)``.
        lon_chunk: Longitude values with the same shape.
        visible_mask: Optional boolean mask for valid positions. When provided,
            it is packed with ``numpy.packbits`` after the coordinate arrays.

    Returns:
        Raw binary payload bytes.
    """
    bindata = (lat_chunk * 100).astype(np.int16).tobytes()
    bindata += (lon_chunk * 100).astype(np.int16).tobytes()
    if visible_mask is not None:
        bindata += np.packbits(visible_mask).tobytes()
    return bindata


def encode_ragged_chunk(
    lat_chunk: np.ndarray,
    lon_chunk: np.ndarray,
    visible_mask: np.ndarray,
) -> bytes:
    """Encode a sparse ragged chunk storing only visible particle positions.

    For each timestep the payload stores ``uint32 count`` followed by
    ``count`` records of ``uint16 particle_index``, ``int16 lat``, ``int16 lon``
    (coordinates scaled by 100).

    Args:
        lat_chunk: Latitude values with shape ``(particles, timesteps)``.
        lon_chunk: Longitude values with the same shape.
        visible_mask: Boolean mask marking valid positions per particle and step.

    Returns:
        Raw binary payload bytes.
    """
    num_particles, num_timesteps = lat_chunk.shape
    chunks: list[bytes] = []
    for time_idx in range(num_timesteps):
        visible_indices = np.flatnonzero(visible_mask[:, time_idx])
        chunks.append(struct.pack("<I", len(visible_indices)))
        for particle_idx in visible_indices:
            chunks.append(struct.pack("<H", int(particle_idx)))
            chunks.append(struct.pack("<h", int(round(lat_chunk[particle_idx, time_idx] * 100))))
            chunks.append(struct.pack("<h", int(round(lon_chunk[particle_idx, time_idx] * 100))))
    return b"".join(chunks)


def decode_dense_chunk(
    payload: bytes,
    num_particles: int,
    timesteps: int,
    has_nans: bool,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Decode a dense binary chunk into arrays used by tests and tooling.

    Args:
        payload: Raw binary payload bytes.
        num_particles: Number of particles declared in the header.
        timesteps: Number of timesteps declared in the header.
        has_nans: Whether a packed visibility bitmask follows the coordinates.

    Returns:
        Tuple of ``(latitudes, longitudes, display_mask)`` where
        ``display_mask`` is all ``True`` when ``has_nans`` is ``False``.
    """
    data_size = num_particles * timesteps
    offset = 0
    lat_raw = struct.unpack(f"<{data_size}h", payload[offset:offset + data_size * 2])
    offset += data_size * 2
    lon_raw = struct.unpack(f"<{data_size}h", payload[offset:offset + data_size * 2])
    offset += data_size * 2

    lats = np.array(lat_raw, dtype=np.float64).reshape(num_particles, timesteps) / 100.0
    lons = np.array(lon_raw, dtype=np.float64).reshape(num_particles, timesteps) / 100.0
    display_mask = np.ones((num_particles, timesteps), dtype=bool)

    if has_nans:
        read_size = int(np.ceil(data_size / 8))
        packed = struct.unpack(f"<{read_size}B", payload[offset:offset + read_size])
        main_i = 0
        for particle_idx in range(num_particles):
            for time_idx in range(timesteps):
                byte_idx = ((particle_idx * timesteps) + time_idx) // 8
                bit_mask = 2 ** (7 - (main_i % 8))
                display_mask[particle_idx, time_idx] = (packed[byte_idx] & bit_mask) > 0
                main_i += 1

    return lats, lons, display_mask


def decode_ragged_chunk(
    payload: bytes,
    num_particles: int,
    timesteps: int,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Decode a ragged binary chunk into full particle arrays.

    Args:
        payload: Raw binary payload bytes.
        num_particles: Number of particles declared in the header.
        timesteps: Number of timesteps declared in the header.

    Returns:
        Tuple of ``(latitudes, longitudes, display_mask)``. Missing positions
        are stored as ``NaN`` in the coordinate arrays.
    """
    lats = np.full((num_particles, timesteps), np.nan, dtype=np.float64)
    lons = np.full((num_particles, timesteps), np.nan, dtype=np.float64)
    display_mask = np.zeros((num_particles, timesteps), dtype=bool)

    offset = 0
    for time_idx in range(timesteps):
        visible_count = struct.unpack_from("<I", payload, offset)[0]
        offset += 4
        for _ in range(visible_count):
            particle_idx = struct.unpack_from("<H", payload, offset)[0]
            offset += 2
            lat_value = struct.unpack_from("<h", payload, offset)[0] / 100.0
            offset += 2
            lon_value = struct.unpack_from("<h", payload, offset)[0] / 100.0
            offset += 2
            lats[particle_idx, time_idx] = lat_value
            lons[particle_idx, time_idx] = lon_value
            display_mask[particle_idx, time_idx] = True

    return lats, lons, display_mask


def decode_chunk(
    payload: bytes,
    num_particles: int,
    timesteps: int,
    has_nans: bool,
    ragged: bool,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Decode a binary chunk using either the dense or ragged layout.

    Args:
        payload: Raw binary payload bytes.
        num_particles: Number of particles declared in the header.
        timesteps: Number of timesteps declared in the header.
        has_nans: Whether the dataset contains missing positions.
        ragged: Whether the payload uses the ragged sparse layout.

    Returns:
        Tuple of ``(latitudes, longitudes, display_mask)``.
    """
    if ragged:
        return decode_ragged_chunk(payload, num_particles, timesteps)
    return decode_dense_chunk(payload, num_particles, timesteps, has_nans)
