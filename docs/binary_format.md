---
layout: default
title: Binary File Format
toc: true
---

## Binary file format

ParticleViz preprocessing converts Lagrangian trajectory data into compact binary
chunks that the React web app loads on demand. Each chunk is shipped as a `.zip`
archive containing a single `.bin` file. A companion `.txt` header file sits
next to the archive and is fetched first by the browser.

### Preprocessing flow

1. Read NetCDF or Zarr trajectories (OceanParcels, OpenDrift, or compatible).
2. Subsample particles separately for desktop and mobile clients.
3. Split the time axis into chunks (default: 50 timesteps per file).
4. Write one header (`.txt`) and one zipped binary payload (`.zip`) per chunk.
5. Store outputs under `ParticleViz_WebApp/data/<experiment_slug>/<subsample>/`.

See also [Code Flow](code_flow.html) for the full pipeline.

### Header file (`.txt`)

Each header is a single CSV-like line with seven fields:

| Field | Type | Description |
|-------|------|-------------|
| 1 | integer | Number of particles after subsampling |
| 2 | integer | Number of timesteps in this chunk |
| 3 | string | Simulation start date/time |
| 4 | string | Time unit (`seconds`, `hours`, `days`, …) |
| 5 | number | Time step magnitude in field 4 |
| 6 | boolean | `True` when the source data contains missing positions |
| 7 | boolean | `True` when the binary payload uses the ragged layout |

Example:

```text
16150, 50, 2021-12-01T00:00:00, days, 1.0, True, True
```

Legacy files with only six fields are still supported; they are treated as dense
(`ragged=False`).

### Dense binary layout (`ragged=False`)

Used when every particle position is valid for every timestep.

1. **Latitudes** — `num_particles × timesteps` values as signed 16-bit integers
   (degrees × 100, little-endian).
2. **Longitudes** — same shape and encoding as latitudes.
3. **Visibility mask** *(only when field 6 is `True`)* — one bit per
   particle/timestep pair, packed with `numpy.packbits` (MSB first within each
   byte). The mask marks positions that should be drawn.

### Ragged binary layout (`ragged=True`)

Used when many particles are inactive (NaN) for large parts of the simulation.
Only visible positions are stored, which reduces download size and parsing time.

For each timestep in the chunk:

| Segment | Type | Description |
|---------|------|-------------|
| Count | `uint32` | Number of visible particles at this timestep |
| Records | repeated `count` times | `uint16` particle index, `int16` lat×100, `int16` lon×100 |

All multi-byte integers are little-endian. The web app expands ragged data back
into per-particle arrays and rebuilds the visibility mask while loading.

### File naming

Given `file_prefix = "pviz"` and experiment name `Global Litter`:

```text
ParticleViz_WebApp/data/global_litter/2/pviz_global_litter_00.txt
ParticleViz_WebApp/data/global_litter/2/pviz_global_litter_00.zip
```

The zip archive contains `pviz_global_litter_00.bin`.

### Reading a chunk in Python

```python
import zipfile
from ParticleViz_DataPreproc.BinaryFormat import decode_chunk, parse_header

with open("pviz_global_litter_00.txt") as header_file:
    header = parse_header(header_file.readline())

with zipfile.ZipFile("pviz_global_litter_00.zip") as archive:
    bin_name = archive.namelist()[0]
    payload = archive.read(bin_name)

num_particles, timesteps, *_ , has_nans, ragged = header
lats, lons, visible = decode_chunk(payload, num_particles, timesteps, has_nans, ragged)
```

`PreprocParticleViz.testBinaryAndHeaderFiles()` provides a quick visual check of
a processed chunk.
