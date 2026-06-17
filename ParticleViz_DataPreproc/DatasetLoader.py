"""Load OceanParcels/OpenDrift particle datasets from NetCDF or Zarr stores."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Tuple

import numpy as np
import xarray as xr
from dateutil.parser import isoparse


@dataclass(frozen=True)
class TimeMetadata:
    """Parsed time axis metadata shared by NetCDF and Zarr inputs.

    Attributes:
        unit: Time unit string (seconds, hours, days).
        start_time: Minimum time value in the dataset.
        start_date: Absolute datetime for the first model timestep.
        delta_t: Time step between consecutive observations.
        is_per_particle: Whether time varies per particle (2-D time array).
    """

    unit: str
    start_time: float
    start_date: datetime
    delta_t: float
    is_per_particle: bool


def set_start_date(start_date_str: str, start_time: int, units: str) -> datetime:
    """Set the initial start date/time of the model.

    Takes into account the reference date in the dataset time units and the
    minimum value in the ``time`` variable.

    Args:
        start_date_str: Initial date string from dataset time units.
        start_time: Offset value from the time variable.
        units: Unit of the offset (seconds, hours, days).

    Returns:
        The calculated start datetime object.
    """
    base_date = isoparse(start_date_str)
    if units == "seconds":
        return base_date + timedelta(seconds=float(start_time))
    if units == "hours":
        return base_date + timedelta(hours=float(start_time))
    if units == "days":
        return base_date + timedelta(days=float(start_time))
    return base_date


def is_zarr_store(file_path: str) -> bool:
    """Return whether the path points to a Zarr store.

    Args:
        file_path: Path to a dataset file or directory.

    Returns:
        True when the path is a Zarr directory store.
    """
    path = Path(file_path)
    if path.suffix == ".zarr":
        return True
    if not path.is_dir():
        return False
    return (path / ".zmetadata").exists() or (path / "zarr.json").exists()


def open_particle_dataset(file_path: str) -> xr.Dataset:
    """Open a particle trajectory dataset from NetCDF or Zarr.

    Args:
        file_path: Path to a NetCDF file or Zarr store directory.

    Returns:
        The opened xarray dataset.
    """
    if is_zarr_store(file_path):
        return xr.open_zarr(file_path, decode_times=False)
    return xr.open_dataset(file_path, decode_times=False)


def normalize_trajectory_dims(xr_ds: xr.Dataset) -> xr.Dataset:
    """Align OceanParcels dimension names across NetCDF and Zarr outputs.

    Recent OceanParcels Zarr exports use ``trajectory`` while NetCDF exports
    use ``traj``. ParticleViz expects the NetCDF naming convention.

    Args:
        xr_ds: Input particle dataset.

    Returns:
        Dataset with ``trajectory`` renamed to ``traj`` when needed.
    """
    if "trajectory" in xr_ds.dims and "traj" not in xr_ds.dims:
        return xr_ds.rename({"trajectory": "traj"})
    return xr_ds


def parse_time_units(units: str) -> Tuple[str, str]:
    """Parse CF-style time units into unit and reference datetime strings.

    Args:
        units: CF time units, e.g. ``days since 2021-12-01:00`` or ``seconds``.

    Returns:
        A tuple of (unit, reference_date) where reference_date is ISO-like.
    """
    units = units.strip()
    if " since " in units:
        unit, reference_date = units.split(" since ", 1)
        return unit.strip(), reference_date.strip()

    # Zarr exports from OceanParcels often store only the unit name.
    return units, "1970-01-01T00:00:00"


def normalize_reference_date(reference_date: str) -> str:
    """Convert NetCDF-style reference dates to ISO-8601 for date parsing.

    Args:
        reference_date: Reference datetime string from dataset metadata.

    Returns:
        ISO-like datetime string suitable for :func:`set_start_date`.
    """
    if "T" not in reference_date and reference_date.count(":") == 1:
        return reference_date.replace(":", "T", 1)
    return reference_date


def get_time_metadata(xr_ds: xr.Dataset) -> TimeMetadata:
    """Extract timing metadata required by the ParticleViz binary writer.

    Args:
        xr_ds: Particle dataset with a ``time`` variable.

    Returns:
        Parsed timing metadata for header generation and NaN handling.
    """
    time_values = np.asarray(xr_ds["time"].values)
    units_raw = xr_ds["time"].attrs.get("units", "seconds since 1970-01-01 00:00:00")
    unit, reference_date = parse_time_units(units_raw)
    reference_date = normalize_reference_date(reference_date)

    start_time = float(np.nanmin(time_values))
    start_date = set_start_date(reference_date, int(start_time), unit)

    is_per_particle = time_values.ndim > 1
    delta_t = 0.0
    particle_idx = 0
    while delta_t == 0.0:
        if is_per_particle:
            delta_t = float(time_values[particle_idx, 1] - time_values[particle_idx, 0])
        else:
            delta_t = float(time_values[1] - time_values[0])
        particle_idx += 1

    return TimeMetadata(
        unit=unit,
        start_time=start_time,
        start_date=start_date,
        delta_t=delta_t,
        is_per_particle=is_per_particle,
    )
