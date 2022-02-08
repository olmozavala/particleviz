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
import json
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

    f = open(config_file)
    config_json = json.load(f)
    # ------------- Preprocessing steps ---------------
    if all or preproc:
        print("Doing preprocessing...")
        mypreproc = PreprocParticleViz(config_file)
        mypreproc.createBinaryFileMultiple()
        print("Done!")

    if all or webapp:
        print("Initializing webapp...")
        # Copy correct Config.json to the src folder
        shutil.copyfile(config_file, join("ParticleViz_WebApp","src","Config.json"))
        shutil.rmtree(join("ParticleViz_WebApp","public","data"))
        shutil.copytree(config_json["webapp"]["data_folder"], join("ParticleViz_WebApp","public","data"))
        # Initilize the server
        subprocess.call("npm start --prefix ./ParticleViz_WebApp", shell=True)
        print("Done!")

