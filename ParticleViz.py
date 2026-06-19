"""ParticleViz Options

Usage:
  ParticleViz.py  --input_file <input_file>
  ParticleViz.py  all --config_file <config_file>
  ParticleViz.py  preproc --config_file <config_file>
  ParticleViz.py  webapp --config_file <config_file>
  ParticleViz.py (-h | --help)
  ParticleViz.py --version

Options:
  -h --help         Show this screen.
  --version         Show version.
  <config_file>     The configuration file to use [default: Config.json]
  <input_file>      NetCDF (.nc) or Zarr store path. OceanParcels, OpenDrift, or convention-compatible output.
"""
from typing import Dict, Any, Optional, Set
import os
import shutil
import json
import subprocess
from os.path import join, dirname, abspath

from docopt import docopt
from ParticleViz_DataPreproc.PreprocParticleViz import PreprocParticleViz
from ParticleViz_DataPreproc.ConfigParams import ConfigParams


def collect_experiment_data_folders(config_json: Dict[str, Any]) -> Set[str]:
    """Return experiment folder slugs referenced by the active configuration.

    Args:
        config_json: Merged ParticleViz configuration dictionary.

    Returns:
        Set of experiment folder names under the preprocessing output root.
    """
    folders: Set[str] = set()
    for dataset_obj in config_json.get("advanced", {}).get("datasets", []):
        for experiment_data in dataset_obj.values():
            data_folder = experiment_data.get("data_folder")
            if data_folder:
                folders.add(data_folder)
    return folders


def copy_preprocessed_data(
    preproc_data_folder: str,
    public_data_folder: str,
    config_json: Dict[str, Any],
) -> None:
    """Copy preprocessed experiment folders into the web app public data tree.

    Args:
        preproc_data_folder: Root directory created by preprocessing.
        public_data_folder: Destination directory served by the React app.
        config_json: Merged configuration with experiment metadata.
    """
    experiment_folders = collect_experiment_data_folders(config_json)
    if not experiment_folders:
        shutil.copytree(preproc_data_folder, public_data_folder)
        return

    os.makedirs(public_data_folder, exist_ok=True)
    for folder_name in sorted(experiment_folders):
        source_folder = join(preproc_data_folder, folder_name)
        if os.path.isdir(source_folder):
            shutil.copytree(
                source_folder,
                join(public_data_folder, folder_name),
                dirs_exist_ok=True,
            )


def main() -> None:
    """Main entry point for ParticleViz CLI."""
    args: Dict[str, Any] = docopt(__doc__, version='ParticleViz 1.0.0')
    config_file: Optional[str] = args.get('<config_file>')
    is_preproc: bool = args.get('preproc', False)
    is_all: bool = args.get('all', False)
    is_webapp: bool = args.get('webapp', False)

    # Handle input file (generate temporary config if needed)
    if config_file is None and args.get('--input_file'):
        dataset_file = args['<input_file>']
        config_obj = ConfigParams()
        config_obj.set_dataset(dataset_file)
        config_json = config_obj.get_config()
        config_file = join(os.getcwd(), "Temp.json")
        is_all = True
    else:
        if config_file == "Config.json" or config_file is None:
            config_file = join(os.getcwd(), "Config.json")

        with open(config_file) as f_in:
            user_config = json.load(f_in)

        config_obj = ConfigParams()
        def_config = config_obj.get_config()
        config_json = config_obj.update_config(def_config, user_config)

    # ------------- Preprocessing steps ---------------
    if is_all or is_preproc:
        print("Doing preprocessing...")
        my_preproc = PreprocParticleViz(config_json)
        my_preproc.createBinaryFileMultiple()
        print("Done!")
    else:
        # Update existing Current_Config.json if only running webapp
        config_obj = ConfigParams()
        try:
            with open("Current_Config.json") as f_curr:
                current_config = json.load(f_curr)
            updated_config = config_obj.update_config(current_config, config_json)
            with open("Current_Config.json", 'w') as f_out:
                json.dump(updated_config, f_out, indent=4)
        except FileNotFoundError:
            print("Warning: Current_Config.json not found. Preprocessing might be required.")

    # ------------- Web App setup ---------------
    if is_all or is_webapp:
        print("Initializing webapp...")
        base_path = dirname(abspath(__file__))
        app_dir = "ParticleViz_WebApp"

        # Deploy configuration
        shutil.copyfile("Current_Config.json", join(base_path, app_dir, "src", "Config.json"))

        # Clean and copy data
        pviz_data_folder = join(base_path, app_dir, "public", "data")
        if os.path.exists(pviz_data_folder):
            shutil.rmtree(pviz_data_folder)

        preproc_data_folder = join(base_path, app_dir, "data")
        print("Copying lagrangian data folder ...")
        copy_preprocessed_data(preproc_data_folder, pviz_data_folder, config_json)

        # Copy extra web data if specified
        try:
            web_data_path = config_json["webapp"].get("data_folder")
            if web_data_path:
                web_data_folder = join(base_path, web_data_path)
                shutil.copytree(web_data_folder, pviz_data_folder, dirs_exist_ok=True)
        except Exception as e:
            print(f"Failed to copy additional web data: {e}")

        # Install dependencies and start server
        node_modules = join(base_path, app_dir, "node_modules")
        if not os.path.exists(node_modules):
            subprocess.call(f"cd {join(base_path, app_dir)} && npm install", shell=True)

        port = config_json.get("advanced", {}).get("port", 3000)
        print(f"Starting web server on http://localhost:{port}/ ...")
        webapp_env = {**os.environ, "PORT": str(port)}
        subprocess.call(
            f"cd {join(base_path, app_dir)} && npm start",
            shell=True,
            env=webapp_env,
        )
        print("Done!")


if __name__ == '__main__':
    main()
