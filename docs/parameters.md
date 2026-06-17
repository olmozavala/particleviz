---
layout: default
title: Parameters
---

## Parameters

Even though most of the parameters are self-explanatory, the meaning of each
of them for the *Preprocessing* section is the following. Default values come from
`ParticleViz_DataPreproc/ConfigParams.py` unless noted.

| Parameter | Required | Depth | Default | Description |
|-----------|----------|-------|---------|-------------|
| **experiments** (array) | True | 1 | One built-in experiment (see below) | List of experiments; each will appear in a dropdown in the visualization. |
| name | True | 2 | `"Dataset 1"` | Experiment name shown in the dropdown. |
| file_name | True | 2 | Required; no default | Path to the experiment output: NetCDF (`.nc`) or Zarr store (`.zarr`). |
| subsample | False | 2 | `{"desktop": 2, "mobile": 4}` | Subsampling factors for desktop and mobile clients. |
| desktop | True* | 3 | `2` | Keep every *n*th particle (`2` = half the particles). |
| mobile | True* | 3 | `4` | Mobile subsample factor (`4` = one quarter of the particles). |
| color_scheme | False | 2 | *(none)* | JSON file defining per-particle colors; preprocessed for each subsample level. |

\*Required when `subsample` is present.

The *advanced* section controls preprocessing output and the local development server:

| Parameter | Required | Depth | Default | Description |
|-----------|----------|-------|---------|-------------|
| **timesteps_by_file** | False | 1 | `50` | Number of timesteps stored in each binary chunk file. |
| **file_prefix** | False | 1 | `"pviz"` | Prefix for generated data files (e.g. `pviz_myexperiment_00.zip`). |
| **port** | False | 1 | `3000` | TCP port for the local development server (`npm start`). Open `http://localhost:<port>/` in your browser. |

Each preprocessed experiment is stored under
`ParticleViz_WebApp/data/<experiment_slug>/<subsample>/`. The slug is derived from
the experiment `name` (lowercase, spaces to underscores). See
[Binary File Format](binary_format.html) for chunk layout details.

The list of parameters for the *webapp* section is the following:

| Parameter | Depth | Default | Description |
|-----------|-------|---------|-------------|
| title | 1 | `"ParticleViz Title"` | Title displayed on the map. |
| particles_color | 1 | `"rgba(255,105,0)"` | Default particle color when no color scheme is used. |
| data_folder | 1 | `ParticleViz_WebApp/data` | Root folder for logos, extra layers, and other static assets. |
| intro_image | 1 | `""` (empty) | Relative path (from `data_folder`) for an intro splash image. |
| url | 1 | `https://olmozavala.github.io/particleviz/` | URL opened by the home icon. |
| intro | 1 | `"This is an example intro text for ParticleViz. Customize it through the config file."` | Intro text on the splash page. |
| zoom-levels | 1 | `[0.36, 0.18, 0.09, 0.045, 0.0225, 0.01125, 0.005625, 0.0028125, 0.00140625]` | Allowed map resolutions, largest to smallest. |
| def-zoom | 1 | `1` | Index into `zoom-levels` for the initial zoom (0-based). |
| map-extent | 1 | `[-360, -90, 360, 90]` | Pan limits: `[min_lon, min_lat, max_lon, max_lat]`. |
| map-center | 1 | `[0, 0]` | Initial map center `[lon, lat]`. |
| particle_size | 1 | `3` | Default particle size (integer 1–5). |
| trail_size | 1 | `3` | Default trail opacity/size (integer 1–5). |
| background | 1 | `4` | Default basemap: `1`=empty, `2`=OSM, `3`=Stamen, `4`=Nature, `5`=Dark. |
| shape_type | 1 | `0` | Particle shape: `0`=squares/dots, `1`=lines. |
| logos (array) | 1 | `[]` | Additional logos in the header. |
| img | 2 | *(none)* | Logo image path, relative to `data_folder`. |
| url | 2 | *(none)* | URL opened when the logo is clicked. |
| extra_layers (array) | 1 | `[]` | Extra [GeoJSON](https://geojson.org/) overlays on the map. |
| name | 2 | *(none)* | Display name for the extra layer. |
| file | 2 | *(none)* | GeoJSON path, relative to `data_folder`. |
| color | 2 | *(none)* | Stroke/fill color for the extra layer. |
