---
layout: default
title: Examples
---

## Examples

### Showcases

Published research visualizations built with ParticleViz. Each showcase includes an interactive map you can explore in the browser, with particle trajectories from Lagrangian ocean models.

<div class="showcase-grid">

<article class="showcase-card">
  <h3 class="showcase-card__title">Caribbean Marine Debris</h3>
  <p class="showcase-card__desc">
    Interactive visualization of marine debris pathways in the Caribbean region, supporting
    analysis of how floating litter moves through island arcs, basins, and coastal zones.
    The underlying simulations and methods are described in
    <a href="https://www.mdpi.com/2077-1312/12/2/319" target="_blank" rel="noopener noreferrer">this <em>Journal of Marine Science and Engineering</em> article</a>.
  </p>
  <p class="showcase-card__meta">Region: Caribbean Sea</p>
  <a class="btn btn--demo showcase-card__link" href="https://ozavala.coaps.fsu.edu/particleviz/CaribbeanMarineDebris/" target="_blank" rel="noopener noreferrer">Open visualization</a>
</article>

<article class="showcase-card">
  <h3 class="showcase-card__title">SeaClearly</h3>
  <p class="showcase-card__desc">
    Interactive web visualization created from the SeaClearly datasets archived on Zenodo.
    The underlying dataset and metadata are available at
    <a href="https://zenodo.org/records/7319767" target="_blank" rel="noopener noreferrer">Zenodo record 7319767</a>.
    SeaClearly was recognized with the Blue Cloud Hackathon prize;
    <a href="https://www.uu.nl/en/news/oceanographers-win-eu25000-blue-cloud-hackathon-prize" target="_blank" rel="noopener noreferrer">read the Utrecht University news story</a>.
  </p>
  <p class="showcase-card__meta">Dataset: SeaClearly</p>
  <a class="btn btn--demo showcase-card__link" href="https://ozavala.coaps.fsu.edu/particleviz/SeaClearly/" target="_blank" rel="noopener noreferrer">Open visualization</a>
</article>

<article class="showcase-card">
  <h3 class="showcase-card__title">Global Marine Litter</h3>
  <p class="showcase-card__desc">
    Basin-scale view of marine litter transport from a global Lagrangian model, illustrating
    how debris accumulates along coastlines and in subtropical gyres over multi-year simulations.
    Described in
    <a href="https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2021.667591/full" target="_blank" rel="noopener noreferrer">this <em>Frontiers in Marine Science</em> paper</a>.
  </p>
  <p class="showcase-card__meta">Region: Global oceans</p>
  <a class="btn btn--demo showcase-card__link" href="http://marinelitter.coaps.fsu.edu/" target="_blank" rel="noopener noreferrer">Open visualization</a>
</article>

</div>

---

### Configurations & Datasets

These configurations use datasets shipped in `ExampleData/`. Each example below has been run with the commands shown; the animations are captured from the generated web interface.

### OceanParcels — `Global_Marine_Debris.nc`

#### Simplest config

Minimal JSON: one experiment and the default subsampling.

```shell
uv run python ParticleViz.py all --config_file ConfigExamples/Config_Simplest.json
```

```json
{
  "preprocessing": {
    "experiments": [{
      "name": "Dataset 1",
      "file_name": "./ExampleData/Global_Marine_Debris.nc",
      "subsample": { "desktop": 2, "mobile": 4 }
    }]
  }
}
```

<img src="{{ '/media/example_simplest.gif' | relative_url }}" alt="Simplest Global Marine Debris example" class="demo-gif" />

#### Colored particles (`Config_GlobalLitter.json`)

Same dataset with a per-particle color scheme for country-based styling.

```shell
uv run python ParticleViz.py all --config_file ConfigExamples/Config_GlobalLitter.json
```

```json
{
  "preprocessing": {
    "experiments": [{
      "name": "January 2010",
      "file_name": "./ExampleData/Global_Marine_Debris.nc",
      "subsample": { "desktop": 1, "mobile": 1 },
      "color_scheme": "./data/color_schemes/ColorSchemeWorldLitter.json"
    }]
  }
}
```

The color scheme maps particle indexes to RGBA colors by country. Excerpt from `data/color_schemes/ColorSchemeWorldLitter.json` (indexes truncated):

```json
{
  "Countries": [
    {
      "name": "Albania",
      "color": "rgb(216.8, 65.0, 65.0, 255.0)",
      "index": "2726,2731,2732,2733,2742,..."
    },
    {
      "name": "Algeria",
      "color": "rgb(53.3, 108.4, 242.2, 255.0)",
      "index": "2040,2041,2049,2062,2091,..."
    }
  ]
}
```

<img src="{{ '/media/example_global_litter.gif' | relative_url }}" alt="Global litter color scheme example" class="demo-gif" />

#### Advanced multi-experiment (`Config_Advanced_Example.json`)

Three experiments on the same file: single color, color by country, and color by mismanaged plastic waste (MPW).

```shell
uv run python ParticleViz.py all --config_file ConfigExamples/Config_Advanced_Example.json
```

Full config: [`ConfigExamples/Config_Advanced_Example.json`](https://github.com/olmozavala/particleviz/blob/master/ConfigExamples/Config_Advanced_Example.json)

```json
{
  "preprocessing": {
    "experiments": [
      {
        "name": "Single Color",
        "file_name": "./ExampleData/Global_Marine_Debris.nc",
        "subsample": { "desktop": 2, "mobile": 2 }
      },
      {
        "name": "Color by Country",
        "file_name": "./ExampleData/Global_Marine_Debris.nc",
        "subsample": { "desktop": 1, "mobile": 9 },
        "color_scheme": "./data/color_schemes/ColorSchemeWorldLitterCountries.json"
      },
      {
        "name": "Color by MPW",
        "file_name": "./ExampleData/Global_Marine_Debris.nc",
        "subsample": { "desktop": 2, "mobile": 2 },
        "color_scheme": "./data/color_schemes/ColorSchemeWorldLitterMPW.json"
      }
    ]
  }
}
```

The file also includes `webapp` (title, map extent, logos, extra layers) and `advanced` (timesteps, file prefix, port) sections — see the [full config on GitHub](https://github.com/olmozavala/particleviz/blob/master/ConfigExamples/Config_Advanced_Example.json).

Use the **Experiment** dropdown in the navbar to switch between the three views.

<img src="{{ '/media/example_advanced.gif' | relative_url }}" alt="Advanced multi-experiment example" class="demo-gif" />

### One-line CLI (no config file)

Equivalent to the simplest example:

```shell
uv run python ParticleViz.py --input_file ExampleData/Global_Marine_Debris.nc
```

See [Quick Start](quick-start.html) for a walkthrough and [Configuration](configuration.html) to customize the web map.
