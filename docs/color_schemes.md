---
layout: default
title: Color Schemes
toc: true
---

## Color scheme JSON format

Color schemes assign per-particle colors in the web app. Provide a JSON file in
the preprocessing `color_scheme` field; ParticleViz adjusts particle indexes for
each subsample level and writes `_Desktop.json` and `_Mobile.json` variants into
the experiment data folder.

### Top-level structure

The file contains exactly one top-level key — the scheme name shown in the layer
menu:

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

During preprocessing, indexes are remapped to match subsampled particles. For a
desktop subsample factor of `2`, particle `100` in the original dataset becomes
particle `50` in the desktop color scheme.

### Preprocessing output

For experiment id `0` and input file `ColorSchemeWorldLitter.json`, preprocessing
writes:

```text
ParticleViz_WebApp/data/global_litter/0_ColorSchemeWorldLitter_Desktop.json
ParticleViz_WebApp/data/global_litter/0_ColorSchemeWorldLitter_Mobile.json
```

The web app loads the variant that matches the active client (desktop or mobile).

### Example files

| File | Purpose |
|------|---------|
| `data/color_schemes/ColorScheme_Example.json` | Minimal two-layer example |
| `data/color_schemes/ColorSchemeWorldLitter.json` | Country-based global litter |
| `data/color_schemes/ColorSchemeWorldLitterCountries.json` | Country aggregation variant |
| `data/color_schemes/ColorSchemeWorldLitterMPW.json` | Mismanaged plastic waste bins |

See [Examples](examples.html) for full configuration snippets that use color
schemes in multi-experiment setups.

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
