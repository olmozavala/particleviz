import pytest
import os
import json
from ParticleViz_DataPreproc.ConfigParams import ConfigParams

def test_default_config():
    config_obj = ConfigParams()
    config = config_obj.get_config()
    assert "preprocessing" in config
    assert "webapp" in config
    assert "advanced" in config
    assert config["preprocessing"]["experiments"][0]["name"] == "Dataset 1"
    assert config["advanced"]["port"] == 3000

def test_update_config_simple():
    current = {"a": 1, "b": 2}
    new = {"b": 3, "c": 4}
    updated = ConfigParams.update_config(current, new)
    assert updated["a"] == 1
    assert updated["b"] == 3
    assert updated["c"] == 4

def test_update_config_nested():
    current = {
        "preprocessing": {
            "experiments": [{"name": "Old"}],
            "output_folder": "old_folder"
        },
        "advanced": {"steps": 50}
    }
    new = {
        "preprocessing": {
            "output_folder": "new_folder"
        },
        "advanced": {"steps": 100}
    }
    updated = ConfigParams.update_config(current, new)
    assert updated["preprocessing"]["output_folder"] == "new_folder"
    assert updated["preprocessing"]["experiments"][0]["name"] == "Old"
    assert updated["advanced"]["steps"] == 100

def test_set_dataset():
    config_obj = ConfigParams()
    config_obj.set_dataset("test_file.nc")
    config = config_obj.get_config()
    assert config["preprocessing"]["experiments"][0]["file_name"] == "test_file.nc"

def test_user_config_does_not_mutate_defaults_for_later_configs():
    """Loading one example config must not leak settings into the next."""
    advanced_config = {
        "webapp": {
            "title": "Marine Plastic Debris Advanced",
            "intro": "Advanced example intro",
        }
    }
    ConfigParams(advanced_config)

    opendrift_config = {
        "preprocessing": {
            "experiments": [
                {
                    "name": "OpenDrift demo",
                    "file_name": "./ExampleData/OpenDrift.nc",
                }
            ]
        }
    }
    config = ConfigParams(opendrift_config).get_config()
    assert config["webapp"]["title"] == "ParticleViz Title"
    assert config["webapp"]["intro"] == (
        "This is an example intro text for ParticleViz. Customize it through the config file.  "
    )


def test_init_with_config():
    new_config = {
        "preprocessing": {
            "experiments": [
                {
                    "name": "Custom",
                    "file_name": "custom.nc"
                }
            ]
        }
    }
    config_obj = ConfigParams(new_config)
    config = config_obj.get_config()
    assert config["preprocessing"]["experiments"][0]["name"] == "Custom"
    assert config["preprocessing"]["experiments"][0]["file_name"] == "custom.nc"
    # Ensure other defaults are preserved
    assert "webapp" in config
    assert "advanced" in config
