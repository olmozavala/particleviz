import json

# "file_name": "../ExampleData/Global_Marine_Debris.nc",
def_config = {
    "preprocessing": {
        "models": [
            {
                "name": "Dataset 1",
                "file_name": "../ExampleData/Particle_AZO_grid100000p_wtides_0615_hourly.nc",
                "subsample": { "desktop":2, "mobile":4 }
            }
        ],
        "output_folder": "./ParticleViz_WebApp/data/"
    },
    "webapp": {
        "data_folder": "./data",
        "title": "ParticleViz Title",
        "particles-color": "rgba(255,105,0)",
        "intro_image": "",
        "url": "https://olmozavala.github.io/particleviz/",
        "intro": "This is an example intro text for ParticleViz. Customize it through the config file.  ",
        "zoom-levels": [ 0.36, 0.18, 0.09, 0.045, 0.0225, 0.01125, 0.005625, 0.0028125, 0.00140625 ],
        "def-zoom": 1,
        "map-extent": [ -180, -90, 180, 90 ],
        "map-center": [0, 0],
        "logos": [],
        "extra_layers_": []
    },
    "advanced": {
        "timesteps_by_file": 50,
        "file_prefix": "pviz"
    }
}
# The configuration file can only have up to 3 nested values so far
class ConfigParams:
    _config_json = {}

    def __init__(self, config_json = None):
        # f = open("Default_Config_File.json")
        # self._config_json = json.load(f)
        self._config_json = def_config
        if config_json != None:
            # Replace everything is inside config_json
            self._config_json = self.update_config(self._config_json, config_json)

    @classmethod
    def update_config(cls, current_config, new_config):
        '''
        This function updates default parameters of the config file with the ones defined
        in the ConfigFile of the user. It does it recursively.
        :param current_config:
        :param new_config:
        :return:
        '''
        if len(new_config) > 1:
            for key,value in new_config.items():
                current_config[key] = cls.update_config(current_config[key], value)
        else:
            key = list(new_config.keys())[0]
            if key in current_config.keys():
                current_config[key] = new_config[key]
            else:
                raise ValueError(F"Key {key} is not a valid entry in the config file.")
        return current_config

    def get_config(self):
        return self._config_json

    def set_dataset(self, file_name):
        '''
        Used to set a single dataset into the configuration file
        :return:
        '''
        # IT should already have a default dataset
        self._config_json["preprocessing"]["models"][0]["file_name"] = file_name

if __name__ == "__main__":
    config_file = "../ConfigExamples/Config_Simplest.json"
    f = open(config_file)
    config_json = json.load(f)
    myparams = ConfigParams(config_json)
    print(myparams.get_config())