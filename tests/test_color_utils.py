import pytest
import os
import json
import numpy as np
import shutil
from ParticleViz_DataPreproc.ColorByParticleUtils import updateColorScheme

@pytest.fixture
def temp_output_dir(tmp_path):
    d = tmp_path / "output"
    d.mkdir()
    return str(d)

@pytest.fixture
def sample_color_scheme(tmp_path):
    scheme = {
        "TestScheme": [
            {"index": "0-10", "color": [255, 0, 0]},
            {"index": "12,14,16", "color": [0, 255, 0]}
        ]
    }
    file_path = tmp_path / "test_scheme.json"
    with open(file_path, "w") as f:
        json.dump(scheme, f)
    return str(file_path)

def test_update_color_scheme_range(sample_color_scheme, temp_output_dir):
    subsample = [2, 5]
    num_part = 20
    updateColorScheme(0, sample_color_scheme, subsample, temp_output_dir, num_part)
    
    desktop_file = os.path.join(temp_output_dir, "0_test_scheme_Desktop.json")
    mobile_file = os.path.join(temp_output_dir, "0_test_scheme_Mobile.json")
    
    assert os.path.exists(desktop_file)
    assert os.path.exists(mobile_file)
    
    with open(desktop_file) as f:
        desktop_data = json.load(f)
        # 0/2 = 0, 10/2 = 5 -> "0-5"
        assert desktop_data["TestScheme"][0]["index"] == "0-5"
        
    with open(mobile_file) as f:
        mobile_data = json.load(f)
        # 0/5 = 0, 10/5 = 2 -> "0-2"
        assert mobile_data["TestScheme"][0]["index"] == "0-2"

def test_update_color_scheme_list(sample_color_scheme, temp_output_dir):
    subsample = [2, 4]
    num_part = 20
    updateColorScheme(1, sample_color_scheme, subsample, temp_output_dir, num_part)
    
    desktop_file = os.path.join(temp_output_dir, "1_test_scheme_Desktop.json")
    mobile_file = os.path.join(temp_output_dir, "1_test_scheme_Mobile.json")
    
    with open(desktop_file) as f:
        desktop_data = json.load(f)
        # 12, 14, 16 all div by 2 -> 6, 7, 8
        assert desktop_data["TestScheme"][1]["index"] == "6,7,8"
        
    with open(mobile_file) as f:
        mobile_data = json.load(f)
        # 12 and 16 div by 4 -> 3, 4. 14 is not.
        assert mobile_data["TestScheme"][1]["index"] == "3,4"
