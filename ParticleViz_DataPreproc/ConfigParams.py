from typing import Any, Dict, Optional, List
import json
import os
from os.path import join, dirname, abspath

parent_path = join(dirname(abspath(__file__)), os.pardir)

def_config: Dict[str, Any] = {
    "preprocessing": {
        "models": [
            {
                "name": "Dataset 1",
                "file_name": "../ExampleData/Particle_AZO_grid100000p_wtides_0615_hourly.nc",
                "subsample": {"desktop": 2, "mobile": 4}
            }
        ],
        "output_folder": f"{join(parent_path, 'ParticleViz_WebApp', 'data')}"
    },
    "webapp": {
        "data_folder": f"{join(parent_path, 'ParticleViz_WebApp', 'data')}",
        "title": "ParticleViz Title",
        "particles_color": "rgba(255,105,0)",
        "intro_image": "",
        "url": "https://olmozavala.github.io/particleviz/",
        "intro": "This is an example intro text for ParticleViz. Customize it through the config file.  ",
        "zoom-levels": [0.36, 0.18, 0.09, 0.045, 0.0225, 0.01125, 0.005625, 0.0028125, 0.00140625],
        "def-zoom": 1,
        "map-extent": [-360, -90, 360, 90],
        "map-center": [0, 0],
        "particle_size": 3,  # Integer from 1 to 5 to define the default size of the particles
        "trail_size": 3,  # Integer from 1 to 5 to define the default size of the trail of the particles
        "background": 4,  # Integer from 1 to 5 to define the default background layer
        # ( 1: empty ,2: osm ,3: stamen ,4: nature ,5: dark },
        "shape_type": 0,  # 0 For squares and 1 for lines
        "logos": [],
        "extra_layers": [],
    },
    "advanced": {
        "timesteps_by_file": 50,
        "file_prefix": "pviz",
    }
}


class ConfigParams:
    """Handle configuration parameters for ParticleViz.

    This class manages the default configuration and allows updating it
    with user-defined values recursively.
    """
    _config_json: Dict[str, Any] = {}

    def __init__(self, config_json: Optional[Dict[str, Any]] = None):
        """Initialize ConfigParams with either default or merged config.

        Args:
            config_json: Optional user-defined configuration dictionary.
        """
        self._config_json = def_config.copy()
        if config_json is not None:
            # Replace everything inside config_json
            self._config_json = self.update_config(self._config_json, config_json)

    @classmethod
    def update_config(cls, current_config: Dict[str, Any], new_config: Any) -> Any:
        """Update default parameters with user-defined ones recursively.

        Args:
            current_config: The dictionary to be updated.
            new_config: The dictionary (or value) containing new settings.

        Returns:
            The updated configuration.
        """
        if isinstance(new_config, dict):
            for key, value in new_config.items():
                try:
                    if key in current_config and (isinstance(value, list) or isinstance(value, dict)):
                        current_config[key] = cls.update_config(current_config[key], value)
                    else:
                        current_config[key] = value
                except Exception as e:
                    print(f"Failed for Key: {key}  Value: {value}. Error: {e}")
        else:
            return new_config
        return current_config

    def get_config(self) -> Dict[str, Any]:
        """Return the current configuration dictionary.

        Returns:
            The configuration as a dictionary.
        """
        return self._config_json

    def set_dataset(self, file_name: str) -> None:
        """Set a single dataset into the configuration.

        Args:
            file_name: The path to the NetCDF file.
        """
        # It should already have a default dataset
        self._config_json["preprocessing"]["models"][0]["file_name"] = file_name


if __name__ == "__main__":
    CONFIG_FILE = "../ConfigExamples/Config_Simplest.json"
    with open(CONFIG_FILE) as f_in:
        config_data = json.load(f_in)
    my_params = ConfigParams(config_data)
    print(my_params.get_config())
