"""ParticleViz Options

Usage:
  ParticleViz.py  --input_file <input_file>
  ParticleViz.py  all --config_file <config_file>
  ParticleViz.py  preproc --config_file <config_file>
  ParticleViz.py  webapp --config_file <config_file>
  ParticleViz.py (-h | --help)
  ParticleViz.py --version

Options:
  -h --help     Show this screen.
  --version     Show version.
  <config_file>     The configuration file to use
                [default: Config.json]
  <input_file>     NetCDF file to use. This is the output of your lagrangian model (OceanParcels)
"""
from ParticleViz_DataPreproc.PreprocParticleViz import PreprocParticleViz
from docopt import docopt
import os
import shutil
import json
from os.path import join
import subprocess
from ParticleViz_DataPreproc.ConfigParams import ConfigParams

if __name__ == '__main__':
    args = docopt(__doc__, version='ParticleViz 0.0.1')
    print(args)
    config_file = args['<config_file>']
    preproc = args['preproc']
    all = args['all']
    webapp = args['webapp']

    # In this case, users are using the default configuration we need to append current directory

    # ------------- If starting form just netcdf file, we generate a default configfile
    if config_file == None and args['--input_file']:
        dataset_file = args['<input_file>']
        config_obj = ConfigParams()  # Get Default parameters
        config_obj.set_dataset(dataset_file)
        config_json = config_obj.get_config()
        config_file = join(os.getcwd(), "Temp.json")
        all = True  # In this case we want to do both
    else:
        if config_file == "Config.json":
            config_file = join(os.getcwd(), config_file)
        f = open(config_file)
        config_json = json.load(f)
        config_obj = ConfigParams()  # Get Default parameters
        def_config = config_obj.get_config()
        config_json = config_obj.update_config(def_config, config_json)  # Update with defined values
        #
    # ------------- Preprocessing steps ---------------
    if all or preproc:
        print("Doing preprocessing...")
        mypreproc = PreprocParticleViz(config_json)
        mypreproc.createBinaryFileMultiple()
        print("Done!")

    if all or webapp:
        print("Initializing webapp...")
        # Copy correct Config.json to the src folder
        shutil.copyfile("Current_Config.json", join("ParticleViz_WebApp","src","Config.json"))
        if os.path.exists(join("ParticleViz_WebApp", "public","data")):
            shutil.rmtree(join("ParticleViz_WebApp", "public","data"))
        shutil.copytree(config_json["webapp"]["data_folder"], join("ParticleViz_WebApp","public","data"))
        # Install npm dependencies if
        if not(os.path.exists(join("ParticleViz_WebApp","node_modules"))):
            subprocess.call("npm install --prefix ./ParticleViz_WebApp", shell=True)
        # Initilize the server
        subprocess.call("npm start --prefix ./ParticleViz_WebApp", shell=True)
        print("Done!")