#  <img src="logos/logo_sm.png" width="200px" style="border:none"> Welcome to ParticleViz  
ParticleViz is an Open Source software that is used to animate
large number of particles inside dynamic web maps.
It is designed mostly for Earth Science scientists
that simulate different processes using Lagrangian models.

The objectives of this software are:
* Provide efficient visualizations that can help analyze and understand research made
through lagrangian modelling in the Earth Sciences, in a fast and easy way. 
* Make it easy to share this research with other colleagues with selfcontained
websites. 

**ParticleViz** currently reads NetCDF outputs from [OceanParcels](https://oceanparcels.org/).

## Status
![GitHub Repo stars](https://img.shields.io/github/stars/olmozavala/particleviz?style=social)
![GitHub](https://img.shields.io/github/license/olmozavala/particleviz)
![GitHub all releases](https://img.shields.io/github/downloads/olmozavala/particleviz/total)
![GitHub issues](https://img.shields.io/github/issues/olmozavala/particleviz)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/olmozavala/particleviz)

## Install
Classic steps:

1. Clone repository
2. Create conda environment with the proper dependencies
3. Enjoy life

```shell
git clone https://github.com/olmozavala/particleviz.git
cd particleviz
```

#### Anaconda
Create new environment from **yml** file and active it.
```shell
conda env create -f particleviz.yml
conda activate particleviz
```

## Quick Start

Once you have installed the [Python dependencies](#python-dependencies) and 
[JS dependencies](#js-dependencies-npm), then the simplest way to 
use **ParticleViz** is to run it specifying the input netcdf from
the command line directly (the netcdf file should have the format 
from [OceanParcels](https://oceanparcels.org/)).
You need to be patient the first time you run it because it will 
install all the Javascript dependencies. It will be much faster after that.
This will generate the *default* web interface to display your data.

```shell
python ParticleViz.py --input_file <path to netcdf> 
```

Test it with the *Global_Marine_Debris.nc* file inside the *ExampleData* folder with:

```shell
python ParticleViz.py --input_file ExampleData/Global_Marine_Debris.nc
```
<img src="{{site.baseurl | prepend: site.url}}media/quickstart.gif" alt="exmample" />


## Advanced Configuration
ParicleViz generates websites in two steps:

* **Preprocessing**. This first step transforms the lagrangian outputs 
into multiple binary files that can be transferred efficiently by the internet. 
* **App builder**. The second step generates a website (react app) that reads binary
 outputs from the **preprocessing** step.

All the customizations of these two steps are made through
a json file. There are several examples at the `ConfigExamples` folder. 
The simples config file you can generate will have just information on the location
of your dataset, like this:

```json
{
  "preprocessing": {
    "models": [{
        "name": "Dataset 1",
        "file_name": "./ExampleData/Global_Marine_debris.nc"}]
    }
}
```
To run *ParticleViz* from a config file you can do it with the following options
```
  ParticleViz.py  all --config_file <config_file>
  ParticleViz.py  preproc --config_file <config_file>
  ParticleViz.py  webapp --config_file <config_file>
```
To run both steps, **Preprocessing** and **App builder**, you use the **all** command, and to run
only one of the two you use **preproc** or **webapp** (you need to run **preproc** at least once before
running webapp).

A configuration file example with all the possible options will be the following:

```json

{
  "preprocessing": {
    "models": [
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
    "particles-color": "rgba(255,105,0)",
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
    "file_prefix": "GlobalLitter"
  }
}
```

You can test this *advanced* configuration file with:

```shell
python ParticleViz.py all --config_file ConfigExamples/Config_Advanced_Example.json
```

<img src="{{site.baseurl | prepend: site.url}}media/advanced.gif" alt="exmample" />


The meaning of each attribute is the *Preprocessing* section is following:
* ***models***. (required) A list of models to be added into the visualizationl. Each model will be available
from a dropdown field. 
  * ***name*** (required) The name of your model, it will be the name that appears in the dropdown.
  * ***file_name*** (required) The path to the netcdf file that stores your model output.
  * ***subsample*** (optional) It is used to indicate if we need to subsample our data for display purposes. 
    * ***desktop*** (required) An integer value that indicates how much should we subsample the data. Ex. a
    2 means half of the particles will be selected at random. 3 means one third, etc. 
    * ***mobile*** (required) An integer value that indicates how much should we subsample the data
    for mobile devices. Normally a higher or equal number than *desktop*.

The meaning of each attribute is the *webapp* section is following:
* ***title***. The title being displayed on the map.
* ***particles-color***. Default color to be used to display the particles.
* ***data_folder***. Path where data (logos, extra layers, etc.) is stored. Default location is at `data`.
* ***intro_image***. Path to an image to use as a replacement of the default intro image. This path is relative to the ***data_folder***.
* ***url***. Default url for the *home* icon.
* ***intro***. Text to display at the intro page. 
* ***zoom-levels***. Available zoom leves that an user can scroll in the map. These numbers
**must** be in decreasing order. (larger numbers are to visualize larger areas and smaller numbers are
used for smaller/zoomed in regions).
* ***def-zoom***. Default zoom index to use. This should be an integer from 0 to the total length of ***zoom-levels***.
* ***map-extent***. Restrict the area where the user can pan the map. 
* ***map-center***. Sets the default center of the map
* ***logos***. List of additional logos
  * ***img***. Path to an image to use in this logo. This path is relative to the ***data_folder***.
  * ***url***. Url to open when clicking on the logo. 
* ***extra_layers***. List of additional *point* geospatial layers to show in the map. 
  * ***name***. Name of the additional layer.
  * ***file***. Path to the additional geojson layer, relative to the ***data_folder***
  * ***color***. Color to use to display this layer. 
 
