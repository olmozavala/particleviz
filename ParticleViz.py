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
from os.path import join, dirname, abspath
import subprocess
from ParticleViz_DataPreproc.ConfigParams import ConfigParams
import glob

def is_zarr_store(path: str) -> bool:
    if not os.path.isdir(path):
        return False
    # Zarr v2 has .zgroup (root), sometimes .zarray in arrays; v3 has zarr.json at root
    markers = (".zgroup", ".zarray", "zarr.json", ".zattrs")
    return any(os.path.exists(os.path.join(path, m)) for m in markers)


if __name__ == '__main__':
    args = docopt(__doc__, version='ParticleViz 0.0.1')
    print(args)
    config_file = args['<config_file>']
    preproc = args['preproc']
    all = args['all']
    webapp = args['webapp']

    # In this case, users are using the default configuration we need to append current directory
    # ------------- If starting from just an input path (file or folder), build config on the fly
# ------------- If starting from just an input path (file or folder), build config on the fly
    if config_file is None and args['--input_file']:
        inpath = args['<input_file>']
        config_obj = ConfigParams()  # Get Default parameters
        config_json = config_obj.get_config()

        if os.path.isdir(inpath):
            # If the directory itself is a Zarr store, treat as a single dataset
            if inpath.lower().endswith(".zarr") and is_zarr_store(inpath):
                config_obj.set_dataset(inpath)
                config_json = config_obj.get_config()
            else:
                # Otherwise, collect many datasets in that folder (non-recursive)
                zarrs = sorted(glob.glob(os.path.join(inpath, "*.zarr")))
                ncs   = sorted(glob.glob(os.path.join(inpath, "*.nc")))
                files = zarrs + ncs
                if not files:
                    raise SystemExit(f"No .zarr or .nc files found in folder: {inpath}")

                models = []
                for fp in files:
                    base = os.path.basename(fp)
                    name = os.path.splitext(base)[0]
                    models.append({
                        "name": name,
                        "file_name": fp,
                        "subsample": {"desktop": 2, "mobile": 4},
                    })
                config_json["preprocessing"]["models"] = models
        else:
            # Single file path (.nc regular file)
            config_obj.set_dataset(inpath)
            config_json = config_obj.get_config()

        config_file = join(os.getcwd(), "Temp.json")
        all = True  # trigger preprocessing


    # ------------- If starting form just netcdf file, we generate a default configfile
#    if config_file == None and args['--input_file']:
#        dataset_file = args['<input_file>']
#        config_obj = ConfigParams()  # Get Default parameters
#        config_obj.set_dataset(dataset_file)
#        config_json = config_obj.get_config()
#        config_file = join(os.getcwd(), "Temp.json")
#        all = True  # In this case we want to do both
    else:  # If start from own config file we update a 'template' config file with the provided information
        if config_file == "Config.json":
            config_file = join(os.getcwd(), config_file)
        f = open(config_file)
        config_json = json.load(f)
        config_obj = ConfigParams()  # Get Default parameters
        def_config = config_obj.get_config()
        config_json = config_obj.update_config(def_config, config_json)  # Update with defined values
        #
    # ------------- Preprocessing steps ---------------
    # In this case we preprocess the data and generate a Current_Config.json file
    if all or preproc:
        print("Doing preprocessing...")
        mypreproc = PreprocParticleViz(config_json)
        mypreproc.createBinaryFileMultiple()  # This function as part of the preprocessing generates the Current_Config.json
        print("Done!")
    else:
        # Here we assume that we are using a previously generated Current_Config.json file so we update it with current parameters
        config_obj = ConfigParams()  # Get Default parameters
        f = open("Current_Config.json")
        current_config_json = json.load(f)
        current_config_json = config_obj.update_config(current_config_json, config_json)  # Update with defined values
        with open("Current_Config.json", 'w') as f:
            json.dump(current_config_json, f, indent=4)

    if all or webapp:
        print("Initializing webapp...")
        basepath = dirname(abspath(__file__))
        appdir = "ParticleViz_WebApp"
        # Copy correct Config.json to the src folder
        # TODO here we should merge the input json with the Current_config one
        shutil.copyfile("Current_Config.json", join(basepath,appdir,"src","Config.json"))
        pviz_data_folder = join(basepath,appdir,"public","data")
        if os.path.exists(pviz_data_folder):
            shutil.rmtree(pviz_data_folder)

        preproc_data_folder = join(basepath, appdir, "data")
        print("Copying lagrangian data folder ...")
        shutil.copytree(preproc_data_folder, pviz_data_folder)
        print("Done!")
        print("Copying web data folder...")
        try:
            web_data_folder = join(basepath, config_json["webapp"]["data_folder"])
            shutil.copytree(web_data_folder, pviz_data_folder, dirs_exist_ok=True)
        except Exception as e:
            print(F"Failed to copy {web_data_folder} into ParticleViz: {e} ")
        print("Done!")
        # Install npm dependencies if
        if not(os.path.exists(join(basepath,appdir,"node_modules"))):
            subprocess.call(f"cd {join(basepath,appdir)} && npm install", shell=True)
        # Initilize the server
        subprocess.call(f"cd {join(basepath,appdir)} && npm start", shell=True)
        print("Done!")
