#!/bin/bash

eval "$(micromamba shell hook --shell=bash)"
micromamba activate particleviz

python ParticleViz.py --input_file ExampleData/Global_Marine_Debris.nc
