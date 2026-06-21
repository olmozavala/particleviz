---
layout: default
title: Configuration
---

## Advanced Configuration

ParticleViz generates websites in two steps:

* **Preprocessing**. This first step transforms the lagrangian outputs
into multiple binary files that can be transferred efficiently by the internet.
* **App builder**. The second step generates a website (react app) that reads binary
 outputs from the **preprocessing** step.

All the customizations of these two steps are made through
a json file. There are several examples at the `ConfigExamples` folder.
The simplest config file you can generate will have just information on the location
of your dataset, like this:

```json
{
  "preprocessing": {
    "experiments": [{
        "name": "Dataset 1",
        "file_name": "./ExampleData/Global_Marine_debris.nc"}]
    }
}
```

To run *ParticleViz* from a config file you can do it with the following options:

```
  ParticleViz.py  all --config_file <config_file>
  ParticleViz.py  preproc --config_file <config_file>
  ParticleViz.py  webapp --config_file <config_file>
```

To run both steps, **Preprocessing** and **App builder**, you will use the `all` command.
To only preprocess your data you will use `preproc` and
to only generate the website you will use `webapp` (you need to run `preproc` at least once before
running **webapp**).

A configuration file example with **all** the possible options is the following:

```json
{
  "preprocessing": {
    "experiments": [
      {
        "name": "January 2010",
        "file_name": "./ExampleData/Global_Marine_Debris.nc",
        "subsample": { "desktop": 2, "mobile": 4 }
      },
      {
        "name": "January 2010",
        "file_name": "./ExampleData/Global_Marine_Debris.nc",
        "subsample": { "desktop": 6, "mobile": 8 }
      }
    ],
    "output_folder": "./ParticleViz_WebApp/data/"
  },
  "webapp": {
    "data_folder": "./data",
    "title": "Marine Plastic Debris Advanced",
    "particles_color": "rgba(255,105,0)",
    "intro_image": "",
    "url": "https://www.coaps.fsu.edu/our-expertise/global-model-for-marine-litter",
    "intro": "This is an example of a ParticleViz visualization of Marine Debris. Try other example configuration files and then with your own data!!!! ",
    "zoom-levels": [ 0.24, 0.12, 0.045, 0.01125, 0.0028125 ],
    "def-zoom": 1,
    "map-extent": [ -180, -90, 180, 90 ],
    "map-center": [ 0, 0 ],
    "logos": [{
      "img": "logos/logo_example.png",
      "url": "https://olmozavala.com"
    }],
    "extra_layers": [
      {
        "name": "World Cities",
        "file": "extra_layers/capitals.geojson",
        "color": "rgb(255,237,0)"
      }
    ]
  },
  "advanced": {
    "timesteps_by_file": 200,
    "file_prefix": "GlobalLitter",
    "port": 3000
  }
}
```

You can test this *advanced* configuration file with:

```shell
uv run python ParticleViz.py all --config_file ConfigExamples/Config_Advanced_Example.json
```

<img src="{{ '/media/advanced.gif' | relative_url }}" alt="Advanced configuration demonstration" class="demo-gif" />

---

## Parameters

Even though most of the parameters are self-explanatory, the meaning of each of them for the *Preprocessing* section is the following. Default values come from `ParticleViz_DataPreproc/ConfigParams.py` unless noted.

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

Each preprocessed experiment is stored under `ParticleViz_WebApp/data/<experiment_slug>/<subsample>/`. The slug is derived from the experiment `name` (lowercase, spaces to underscores). See [Dev Docs](dev_docs.html#binary-file-format) for chunk layout details.

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

---

## Color Schemes

Color schemes assign per-particle colors in the web app. Provide a JSON file in the preprocessing `color_scheme` field; ParticleViz adjusts particle indexes for each subsample level and writes `_Desktop.json` and `_Mobile.json` variants into the experiment data folder.

### JSON format & top-level structure

The file contains exactly one top-level key — the scheme name shown in the layer menu:

```json
{
  "Countries": [
    {
      "name": "Albania",
      "color": "rgb(216.8, 65.0, 65.0, 255.0)",
      "index": "2726,2731,2732"
    },
    {
      "name": "Algeria",
      "color": "rgb(53.3, 108.4, 242.2, 255.0)",
      "index": "2040-2099"
    }
  ]
}
```

### Layer fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Label shown in the layer toggle menu |
| `color` | yes | CSS color string (`rgb(...)`, `rgba(...)`, or named color) |
| `index` | yes | Particle indexes covered by this layer |

### Index formats

**Range** — inclusive start and end, separated by a hyphen:

```json
"index": "0-1000"
```

**List** — comma-separated particle indexes:

```json
"index": "12,48,96,144"
```

### Example files

| File | Purpose |
|------|---------|
| `data/color_schemes/ColorScheme_Example.json` | Minimal two-layer example |
| `data/color_schemes/ColorSchemeWorldLitter.json` | Country-based global litter |
| `data/color_schemes/ColorSchemeWorldLitterCountries.json` | Country aggregation variant |
| `data/color_schemes/ColorSchemeWorldLitterMPW.json` | Mismanaged plastic waste bins |

See [Examples](examples.html) for full configuration snippets that use color schemes in multi-experiment setups.

### Configuration reference

Add a color scheme to an experiment in the preprocessing section:

```json
{
  "preprocessing": {
    "experiments": [
      {
        "name": "Color by Country",
        "file_name": "./ExampleData/Global_Marine_Debris.nc",
        "subsample": { "desktop": 1, "mobile": 9 },
        "color_scheme": "./data/color_schemes/ColorSchemeWorldLitterCountries.json"
      }
    ]
  }
}
```

When no `color_scheme` is provided, all particles use `webapp.particles_color`.
