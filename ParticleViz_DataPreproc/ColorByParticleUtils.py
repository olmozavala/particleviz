import xarray as xr
import numpy as np
import os
from os.path import join
import pandas as pd
import json
import copy


def updateColorScheme(model_id, json_file, subsample, output_folder, num_part):
    """
    This function generates specific color squemes for the subsampled data (one for the 'Desktop' and one for 'Mobile').
    :param json_file: json file with the color squeme
    :param subsample: subsample integer that indicates the subsampled level (2 for half, 3 for one third, etc.)
    :param output_folder: internal folder where ParticleViz will store these new colorsquemes
    :param num_part: Total number of particles that this model has (before subsampling)
    :return:
    """
    print("Preprocessing color scheme....")
    f = open(json_file)
    data = json.load(f)
    f.close()
    desktop_json = copy.deepcopy(data)
    mobile_json = copy.deepcopy(data)

    scheme_name = list(data.keys())[0]  # We only allow one name
    for i, cc_scheme in enumerate(data[scheme_name]): # Iterate over all the
        orig_index = cc_scheme['index']
        if orig_index.find("-") != -1: # In this case we have a range
            orig_start = int(orig_index.split('-')[0])
            orig_end = int(orig_index.split('-')[1])
            new_start_desktop = int(np.ceil(orig_start/subsample[0]))
            new_end_desktop = int(np.floor(orig_end/subsample[0]))

            new_start_mobile = int(np.ceil(orig_start/subsample[1]))
            new_end_mobile = int(np.floor(orig_end/subsample[1]))

            desktop_index = F'{new_start_desktop}-{new_end_desktop}'
            mobile_index = F'{new_start_mobile}-{new_end_mobile}'
            # Debug
            print(F"Old: {orig_index}, subsample:{subsample}, desktop:{desktop_index}, mobile: {mobile_index}")
        else:  # In this case we have a sequence
            # print("WARNING: When setting the color scheme with specific indexes, the "
            #       "assigned color may not be correct if you are subsampling the data!")
            orig_index_int = np.array([int(x) for x in orig_index.split(',')])
            desk_valid_idxs = [str(int(x/subsample[0])) for x in orig_index_int if x % subsample[0] == 0 and x < num_part]
            mob_valid_idxs = [str(int(x/subsample[1])) for x in orig_index_int if x % subsample[1] == 0 and x < num_part]
            desktop_index = ','.join(desk_valid_idxs)
            mobile_index = ','.join(mob_valid_idxs)

        mobile_json[scheme_name][i]['index'] = mobile_index
        desktop_json[scheme_name][i]['index'] = desktop_index

    print("Saving ColorSchemes...")
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    with open(join(output_folder, f"{model_id}_{os.path.basename(json_file).replace('.json','')}_Desktop.json"), 'w') as f:
        json.dump(desktop_json, f, indent=4)


    with open(join(output_folder, f"{model_id}_{os.path.basename(json_file).replace('.json','')}_Mobile.json"), 'w') as f:
            json.dump(mobile_json, f, indent=4)

    print("Done!")
