from typing import List, Dict, Any
import os
from os.path import join, basename
import json
import copy
import numpy as np


def updateColorScheme(model_id: int, json_file: str, subsample: List[int],
                      output_folder: str, num_part: int) -> None:
    """Generate specific color schemes for the subsampled data.

    Creates one version for 'Desktop' and one for 'Mobile' by adjusting
    particle indexes based on the subsampling level.

    Args:
        model_id: The ID of the model.
        json_file: Path to the JSON file with the color scheme.
        subsample: List with two integers [desktop_subsample, mobile_subsample].
        output_folder: Directory where the new color schemes will be saved.
        num_part: Total number of particles before subsampling.
    """
    print("Preprocessing color scheme....")
    with open(json_file) as f_in:
        data = json.load(f_in)

    desktop_json = copy.deepcopy(data)
    mobile_json = copy.deepcopy(data)

    scheme_name = list(data.keys())[0]  # We only allow one name
    for i, cc_scheme in enumerate(data[scheme_name]):
        orig_index = cc_scheme['index']
        if orig_index.find("-") != -1:  # Range-based index
            orig_start = int(orig_index.split('-')[0])
            orig_end = int(orig_index.split('-')[1])
            new_start_desktop = int(np.ceil(orig_start / subsample[0]))
            new_end_desktop = int(np.floor(orig_end / subsample[0]))

            new_start_mobile = int(np.ceil(orig_start / subsample[1]))
            new_end_mobile = int(np.floor(orig_end / subsample[1]))

            desktop_index = f'{new_start_desktop}-{new_end_desktop}'
            mobile_index = f'{new_start_mobile}-{new_end_mobile}'
            # Debug
            print(f"Old: {orig_index}, subsample: {subsample}, desktop: {desktop_index}, mobile: {mobile_index}")
        else:  # Sequence-based index
            orig_index_int = np.array([int(x) for x in orig_index.split(',')])
            desk_valid_idxs = [str(int(x / subsample[0])) for x in orig_index_int
                               if x % subsample[0] == 0 and x < num_part]
            mob_valid_idxs = [str(int(x / subsample[1])) for x in orig_index_int
                              if x % subsample[1] == 0 and x < num_part]
            desktop_index = ','.join(desk_valid_idxs)
            mobile_index = ','.join(mob_valid_idxs)

        mobile_json[scheme_name][i]['index'] = mobile_index
        desktop_json[scheme_name][i]['index'] = desktop_index

    print("Saving ColorSchemes...")
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    desktop_filename = f"{model_id}_{basename(json_file).replace('.json', '')}_Desktop.json"
    mobile_filename = f"{model_id}_{basename(json_file).replace('.json', '')}_Mobile.json"

    with open(join(output_folder, desktop_filename), 'w') as f_out:
        json.dump(desktop_json, f_out, indent=4)

    with open(join(output_folder, mobile_filename), 'w') as f_out:
        json.dump(mobile_json, f_out, indent=4)

    print("Done!")
