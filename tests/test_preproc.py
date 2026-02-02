import pytest
from unittest.mock import MagicMock
import numpy as np
import xarray as xr
import os
import shutil
import json
from datetime import datetime
from ParticleViz_DataPreproc.PreprocParticleViz import PreprocParticleViz, set_start_date
from ParticleViz_DataPreproc.PreprocConstants import ModelType

def test_set_start_date():
    start_date_str = "2020-01-01T00:00:00"
    
    # Seconds
    dt_sec = set_start_date(start_date_str, 3600, "seconds")
    assert dt_sec == datetime(2020, 1, 1, 1, 0, 0)
    
    # Hours
    dt_hour = set_start_date(start_date_str, 1, "hours")
    assert dt_hour == datetime(2020, 1, 1, 1, 0, 0)
    
    # Days
    dt_day = set_start_date(start_date_str, 1, "days")
    assert dt_day == datetime(2020, 1, 2, 0, 0, 0)

def test_get_output_type():
    preproc = PreprocParticleViz({"preprocessing": {"models": [], "output_folder": ""}, "advanced": {"timesteps_by_file": 50, "file_prefix": "pviz"}})
    
    # OceanParcels mock
    ds_parcels = MagicMock(spec=xr.Dataset)
    ds_parcels.attrs = {"parcels_version": "2.0"}
    assert preproc.getOutputType(ds_parcels) == ModelType.OCEAN_PARCELS
    
    # OpenDrift mock
    ds_opendrift = MagicMock(spec=xr.Dataset)
    ds_opendrift.attrs = {"opendrift_version": "1.0"}
    assert preproc.getOutputType(ds_opendrift) == ModelType.OPEN_DRIFT
    
    # Heuristics mock
    ds_heuristics = MagicMock(spec=xr.Dataset)
    ds_heuristics.attrs = {}
    ds_heuristics.variables.keys.return_value = ["obs", "traj", "lon", "lat", "z", "time"]
    assert preproc.getOutputType(ds_heuristics) == ModelType.OCEAN_PARCELS

def test_get_tot_time_steps_and_num_particles():
    preproc = PreprocParticleViz({"preprocessing": {"models": [], "output_folder": ""}, "advanced": {"timesteps_by_file": 50, "file_prefix": "pviz"}})
    
    ds = MagicMock()
    ds.trajectory.size = 10
    ds.time.size = 100
    ds.obs.size = 200
    ds.traj.size = 20
    
    # OpenDrift
    steps, parts = preproc.getTotTimeStepsAndNumParticles(ModelType.OPEN_DRIFT, ds)
    assert steps == 10
    assert parts == 100
    
    # OceanParcels
    steps, parts = preproc.getTotTimeStepsAndNumParticles(ModelType.OCEAN_PARCELS, ds)
    assert steps == 200
    assert parts == 20

def test_create_binary_file_multiple(tmp_path):
    # Setup temporary directories
    output_dir = tmp_path / "output"
    output_dir.mkdir()
    
    # Use a real sample file from ExampleData
    sample_file = "ExampleData/cm_uniform_2021-12-01.nc"
    if not os.path.exists(sample_file):
        pytest.skip("Sample file not found")
        
    config = {
        "preprocessing": {
            "models": [
                {
                    "name": "TestModel",
                    "file_name": sample_file,
                    "subsample": {"desktop": 2, "mobile": 4}
                }
            ],
            "output_folder": str(output_dir)
        },
        "advanced": {
            "timesteps_by_file": 10,
            "file_prefix": "test_pviz"
        }
    }
    
    preproc = PreprocParticleViz(config)
    # This should run without error
    preproc.createBinaryFileMultiple()
    
    # Verify outputs
    desktop_dir = output_dir / "2"
    mobile_dir = output_dir / "4"
    assert desktop_dir.exists()
    assert mobile_dir.exists()
    
    # Check if files were generated
    # The sample file has 32 timesteps, so with 10 steps per file, we expect 4 files per subsample
    for i in range(4):
        assert (desktop_dir / f"test_pviz_testmodel_{i:02d}.txt").exists()
        assert (desktop_dir / f"test_pviz_testmodel_{i:02d}.zip").exists()
        assert (mobile_dir / f"test_pviz_testmodel_{i:02d}.txt").exists()
        assert (mobile_dir / f"test_pviz_testmodel_{i:02d}.zip").exists()
    
    # Verify Current_Config.json update
    assert os.path.exists("Current_Config.json")
    with open("Current_Config.json") as f:
        config_data = json.load(f)
        assert len(config_data["advanced"]["datasets"]) == 1
        assert "TestModel" in config_data["advanced"]["datasets"][0]
