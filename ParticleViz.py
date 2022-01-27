"""OZ example.

Usage:
  ParticleViz.py  all
  ParticleViz.py  all --config <config_file>
  ParticleViz.py  preproc
  ParticleViz.py  preproc --config <config_file>
  ParticleViz.py  webapp
  ParticleViz.py  webapp --config <config_file>
  ParticleViz.py (-h | --help)
  ParticleViz.py --version

Options:
  -h --help     Show this screen.
  --version     Show version.
  <config_file>     The file name
                [default: Config.json]
"""
from ParticleViz_DataPreproc.PreprocParticleViz import PreprocParticleViz
from docopt import docopt
import os
import shutil
from os.path import join
import subprocess

if __name__ == '__main__':
    args = docopt(__doc__, version='ParticleViz 0.0.1')
    print(args)
    config_file = args['<config_file>']
    preproc = args['preproc']
    all = args['all']
    webapp = args['webapp']

    # In this case, users are using the default configuration we need to append current directory
    if config_file == "Config.json":
        config_file = join(os.getcwd(), config_file)

    # ------------- Preprocessing steps ---------------
    if all or preproc:
        mypreproc = PreprocParticleViz(config_file)
        mypreproc.createBinaryFileMultiple()

    if all or webapp:
        # Copy correct Config.json to the src folder
        shutil.copyfile(config_file, join("ParticleViz_WebApp","src","Config.json"))
        # Initilize the server
        subprocess.call("npm start --prefix ./ParticleViz_WebApp", shell=True)

