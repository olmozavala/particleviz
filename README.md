
#  <img src="docs/logos/logo_sm.png" width="200px" style="border:none"> Welcome to ParticleViz  
ParticleViz is an Open Source software that is used to animate large number of particles inside dynamic web maps.
It is designed mostly for Earth Science scientists that simulate different processes using Lagrangian models.

The objectives of this software are:
* Provide efficient visualizations that can help analyze and understand research made through lagrangian modelling in the Earth Sciences, in a fast and easy way. 
* Make it easy to share this research with other colleagues with self-contained websites. 

**ParticleViz** currently reads NetCDF outputs from [OceanParcels](https://oceanparcels.org/) and [OpenDrift](https://opendrift.github.io/).

## Status
![GitHub Repo stars](https://img.shields.io/github/stars/olmozavala/particleviz?style=social)
![GitHub](https://img.shields.io/github/license/olmozavala/particleviz)
![GitHub all releases](https://img.shields.io/github/downloads/olmozavala/particleviz/total)
![GitHub issues](https://img.shields.io/github/issues/olmozavala/particleviz)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/olmozavala/particleviz)

## Install

1. Clone the repository.

```shell
git clone https://github.com/olmozavala/particleviz.git
cd particleviz
```

2. Create a conda environment with the proper dependencies. For this step, you first need to install Anaconda (or Miniconda), more details can be found [here](https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html).

```shell
conda env create -f particleviz.yml
conda activate particleviz
```

3. Enjoy life

## Quick Start

The simplest way to use **ParticleViz** is to run it specifying the input netcdf from the command line directly (NetCDF should follow [OceanParcels](https://oceanparcels.org/) or [OpenDrift](https://opendrift.github.io/) format).

```shell
python ParticleViz.py --input_file <path_to_netcdf> 
```

This will generate the *default* web interface and store the parameters into a configuration file, `Current_Config.json`. It can be edited to customize the interface.

You need to be _patient_ the first time you run it because it will install all the Javascript dependencies (stored in the `node_modules` folder).

Test it with the *Global_Marine_Debris.nc* example file in the *ExampleData* folder:

```shell
python ParticleViz.py --input_file ExampleData/Global_Marine_Debris.nc
```
<img src="docs/media/quickstart.gif" alt="example" />

## Intro video
This is a presentation made at OceanSciences meeting about ParticleViz in March 2022.

[![ParticleViz at OSM](docs/media/video_tm.png)](https://youtu.be/7Xk0DxRMPjQ?t=289)

## Docs
Please take a look at the complete docs at [https://olmozavala.github.io/particleviz/](https://olmozavala.github.io/particleviz/)