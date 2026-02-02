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
    assert config["preprocessing"]["models"][0]["name"] == "Dataset 1"

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
            "models": [{"name": "Old"}],
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
    assert updated["preprocessing"]["models"][0]["name"] == "Old"
    assert updated["advanced"]["steps"] == 100

def test_set_dataset():
    config_obj = ConfigParams()
    config_obj.set_dataset("test_file.nc")
    config = config_obj.get_config()
    assert config["preprocessing"]["models"][0]["file_name"] == "test_file.nc"

def test_init_with_config():
    new_config = {
        "preprocessing": {
            "models": [
                {
                    "name": "Custom",
                    "file_name": "custom.nc"
                }
            ]
        }
    }
    config_obj = ConfigParams(new_config)
    config = config_obj.get_config()
    assert config["preprocessing"]["models"][0]["name"] == "Custom"
    assert config["preprocessing"]["models"][0]["file_name"] == "custom.nc"
    # Ensure other defaults are preserved
    assert "webapp" in config
    assert "advanced" in config
