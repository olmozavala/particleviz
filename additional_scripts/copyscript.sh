#!/bin/bash
# You must first run npm run build
scp -r  build ozavala@ozavala.coaps.fsu.edu:/var/www/virtualhosts/ozavala.coaps.fsu.edu/temp

