#!/bin/bash
set -e
cd "$(dirname "$0")"
uv run python ParticleViz.py --input_file ExampleData/Global_Marine_Debris.nc
