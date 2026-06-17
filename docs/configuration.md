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

See [Parameters](parameters.html) for the full list of configuration keys and their default values.
