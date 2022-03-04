## Files
### Index.js
First file. It defines the following:
* Default background layer
* Ip address that indicates from where are the binary files and 
tables being loaded. 
* Zoom resolutions for the map

### ParticleVizManager.js
This file manages most of the application.
It defines:
* wms_url -> From were are we reading the histograms (ncWMS)
* Colors for each continent
* Number of files in each month selection

### ParticlesLayer.js
File in charge of displaying the particles
* Trail size options
* Particle size options
* Default font size 
* Particles per file 
* How many previous days to draw when the animation is updated
* Maximum animation speed