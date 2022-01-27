# Welcome to ParticleViz
ParticleViz is an Open Source software that is used to animate
large number of particles inside dynamic web maps.
It is designed mostly for Earth Science scientists
that simulate different processes using Lagrangian models.

##Install

```shell
echo "test"
```

## Configuration
ParicleViz generates websites in two steps:

* **Preprocessing** This first step transforms the 
lagrangian outputs (from OceanParcels) into multiple
binary files that can be transferred efficiently by
the internet. 
* **React app** The second step generates a website
  (react app) that reads the outputs from the previous.

All the customizations of these two steps are made through
a json file like `Config.json`. Here is an example
of this configuration file:

```json
{
  "preprocessing": {
    "input_file": "../ExampleData/Global_Marine_Debris.nc",
    "output_folder": "../ParticleViz_WebApp/data/",
    "subsample": [2, 4],
    "timesteps_by_file": 20
  },
  "webapp": {
    "title": "YOUR MAP TITLE",
    "particles-color": "rgba(82,21,98)",
    "start-date": "2021-10-10T00:00:00",
    "desktop-subsample": "2",
    "mobile-subsample": "4",
    "ip_address": "http://localhost:3000/particleviz",
    "zoom-levels": [0.36, 0.18, 0.09, 0.045, 0.0225, 0.01125, 0.005625, 0.0028125, 0.00140625],
    "def-zoom": 1,
    "map-extent": [-180, -90, 180, 90],
    "map-center": [0, 0]
  }
}
```
### Preprocessing
The meaning of each attribute is the following:
* ***input_file***. This is a *NetCDF* file that containst
the location of the particles to plot. We currently support the
default outputs from the **OceanParcels** software.
* ***output_folder***. This is the folder were we want to 
store our subsampled binary files that will be read by a *ParticleViz*
web app. 
* ***subsample***. This is an array of integers that indicates 
if we want to randomly subample our data when generating the
ParticleViz binary files. A **1** means we will not do
any subsampling, a **2** means we will select only half
of particles, **3** one third, etc. ParticleViz
can animate smoothly around **10k** particles per timestep 
in a high-end computer. Anything beyond that it may be
a good idea to subsample your data. 

## ParticleViz binary files
These files 
