import struct
__author__="Olmo S. Zavala Romero"

import numpy as np
from netCDF4 import Dataset
import xarray as xr
import os
from os.path import join
import json
import zipfile
import cartopy.crs as ccrs
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from dateutil.parser import isoparse

def set_start_date(start_date_str, start_time, units):
    """
    This function is used to set the intitial start date/time of the model. It takes into account the
    'units' property of the netcdf and the minimum value in the 'time' variable fo the netcdf
    :param start_date_str:
    :param start_time:
    :param units:
    :return:
    """
    if units == 'seconds':
        return isoparse(start_date_str) + timedelta(seconds=start_time)
    if units == 'hours':
        return isoparse(start_date_str) + timedelta(hours=start_time)
    if units == 'days':
        return isoparse(start_date_str) + timedelta(days=start_time)

class PreprocParticleViz:
    def __init__(self, config_json):
        '''
        :param config_json: The configuration parameters to use
        '''
        config = config_json["preprocessing"]
        config_adv = config_json["advanced"]
        self._config_json = config_json
        self._models = config["models"]
        self._output_folder = config["output_folder"]
        self._timesteps_by_file = config_adv["timesteps_by_file"]  # How many timesteps do we want to store in each binary file
        self._file_prefix = config_adv["file_prefix"]  # Output file name to use by ParticleViz

    def createBinaryFileMultiple(self):
        """
        Creates binary and text files corresponding to the desired 'subsampled' number of particles
        :return:
        """
        timesteps_by_file = self._timesteps_by_file# How many locations to save in each file

        self._config_json["advanced"]["datasets"] = {}

        print("Reading data...")
        # Iterate over all the specified models
        for id, c_model in enumerate(self._models):
            model_name = c_model["name"]
            file_name = c_model["file_name"]
            # Reading the output from Ocean Parcles
            nc_file = xr.open_dataset(file_name)
            # This is only used to access time units string (TODO move everything to the NetCDF4 or Xarray library)
            ds = Dataset(file_name)

            tot_time_steps = nc_file.obs.size
            glob_num_particles = nc_file.traj.size
            tot_files = tot_time_steps//timesteps_by_file + 1

            # Here we update the total number of files generated for this
            self._config_json["advanced"]["datasets"][model_name] = {}
            self._config_json["advanced"]["datasets"][model_name]["total_files"] = tot_files
            self._config_json["advanced"]["datasets"][model_name]["name"] = model_name
            self._config_json["advanced"]["datasets"][model_name]["file_name"] = F"{self._file_prefix}_{model_name.strip().lower()}"

            print(F"Total number of timesteps: {tot_time_steps} Total number of particles: {glob_num_particles} ({tot_time_steps * glob_num_particles} positions, Number of files: {tot_files}) ")

            # Print variables
            print("----- Variables Inside file ----")
            all_vars = nc_file.variables
            for name in all_vars.keys():
                print(name)

            lat_all = all_vars['lat']
            lon_all = all_vars['lon']
            times_all = all_vars['time']

            time_units_str = ds.variables['time'].units.split(" ")
            # Compute the start date from the start unit and the first timestep

            delta_t_str = time_units_str[0]
            start_time = int(np.nanmin(ds['time']))  # Read the 'first time'
            start_date = set_start_date(time_units_str[2], start_time, time_units_str[0])
            # TODO here we assume we have at least 2 particles and the delta_t is constant
            delta_t = 0.0
            i_part = 0
            # We look for a time delta within the particles first couple of times.
            while delta_t == 0.0:
                delta_t = ds['time'][i_part,1] - ds['time'][i_part,0]
                i_part += 1

            # Iterate over the options to reduce the number of particles
            subsample_model = [2,4]
            if 'desktop' in c_model['subsample'].keys():
                subsample_model[0] = c_model['subsample']['desktop']
            if 'mobile' in c_model['subsample'].keys():
                subsample_model[1] = c_model['subsample']['mobile']

            self._config_json["advanced"]["datasets"][model_name]["subsample"] = {}
            self._config_json["advanced"]["datasets"][model_name]["subsample"]["desktop"] = subsample_model[0]
            self._config_json["advanced"]["datasets"][model_name]["subsample"]["mobile"] = subsample_model[1]
            for subsample_data in subsample_model:

                final_ouput_folder = F"{self._output_folder}/{subsample_data}"
                if not(os.path.exists(final_ouput_folder)):
                    os.makedirs(final_ouput_folder)

                # Subsampled locations
                lat = lat_all[::subsample_data, :]
                lon = lon_all[::subsample_data, :]
                times = times_all[::subsample_data, :]

                # ------ Fixing nans (replace nans with the last value of that particle)
                # It only works if the nans are at the end
                # Here it finds all the particles that finish with a nan value
                nan_idxs = np.where(np.isnan(lat[:,-1]).data)[0]
                HAS_NANS = False
                if len(nan_idxs) > 0:
                    print("Analyzing nan values ....")
                    HAS_NANS = True
                    bit_display_array = np.ones(lat.shape, dtype=bool)
                    # Now it verifies the time of the particle
                    first_nan = times[:,0] > times[0,:]
                    # Identify the start time for this particle (compare vs time of first particle)
                    start_time_idx = np.argmax(first_nan.data, axis=1)
                    start_time_idx -= 1  # Fixing the index
                    for idx, i in enumerate(nan_idxs):
                        if idx % 1000 == 0:
                            print(F"Particle {idx} of {len(nan_idxs)}")
                        # Re-align vectors so that the times matches between all the particles
                        if start_time_idx[i] > 0:
                            lat[i,:] = np.roll(lat[i, :], start_time_idx[i])
                            lon[i,:] = np.roll(lon[i, :], start_time_idx[i])

                    bit_display_array = np.logical_not(np.isnan(lat))

                    print("Done!")

                # TODO in our current solution, when particles do not share the same time (for example,
                # particle 1 has times at 0 and 12 but particle 2 has times at 6 and 18, then we arbitrarly
                # choose one of the two
                # Iterate over the number of partitioned files (how many files are we going to create)
                for ichunk, cur_chunk in enumerate(np.arange(0, tot_time_steps, timesteps_by_file)):
                    print(F"Working with file {ichunk}...")

                    next_time_step = int(min(cur_chunk+timesteps_by_file, tot_time_steps))
                    # Add the particles for this file. Here we are reducing the precision of the positions
                    this_file = {'lat_lon': [np.around(lat[:, cur_chunk:next_time_step],2),
                                             np.around(lon[:, cur_chunk:next_time_step],2)]}

                    # # ------------- Writing the binary file  --------------
                    bindata = b''
                    # num_particles, num_timesteps, start_date, delta_t_str
                    header_txt = F"{len(this_file['lat_lon'][0])}, {len(this_file['lat_lon'][0][0])}, {start_date}, {delta_t_str}, {delta_t}, {HAS_NANS}\n"
                    # Here we reduce transform to 16 bit integer
                    # Limits for int16 are -32768 to 32767
                    bindata += (np.array(this_file['lat_lon'][0])*100).astype(np.int16).tobytes()  # Adds the lons to the file
                    bindata += (np.array(this_file['lat_lon'][1])*100).astype(np.int16).tobytes()  # Adds the lats to the file

                    if HAS_NANS: # Include information on when to display the particles
                        bindata += np.packbits(bit_display_array[:, cur_chunk:next_time_step]).tobytes()
                        np.packbits(bit_display_array[0:2,0:3].data).tobytes()

                    output_file_name = F"{self._file_prefix}_{model_name.strip().lower()}"
                    print(F" Saving binary file {final_ouput_folder}.....")
                    header_output_file = F"{final_ouput_folder}/{output_file_name}_{ichunk:02d}.txt"
                    binary_file = F"{final_ouput_folder}/{output_file_name}_{ichunk:02d}.bin"
                    zip_output_file = F"{final_ouput_folder}/{output_file_name}_{ichunk:02d}.zip"
                    # -------- Writing header file ---------------
                    f = open(header_output_file,'w')
                    f.write(header_txt)
                    f.close()
                    # -------- Writing binary file---------------
                    f = open(binary_file,'wb')
                    f.write(bindata)
                    f.close()
                    # -------- Writing zip file (required because the website reads zip files) ---------------
                    print(F" Saving zip file {zip_output_file} ( Time steps from {cur_chunk} to {next_time_step}) .....")
                    with zipfile.ZipFile(zip_output_file, 'w') as zip_file:
                        zip_file.write(binary_file)
                    zip_file.close()
                    # -----  Remove binary file, ParticleViz reads the zip file directly
                    os.remove(binary_file)

            # Updating config file inside ParticleViz WebAapp
            with open("Current_Config.json", 'w') as f:
                json.dump(self._config_json, f, indent=4)
            nc_file.close()

    def testBinaryAndHeaderFiles(self, test_file):
        """
        Plots a single binary file.
        :param test_file: the file name to test (without .txt nor .bin)
        :return:
        """
        # -------- This part is just to test the reading of a specific binary file
        header_file = F"{test_file.replace('.txt','').replace('.bin','')}.txt"
        bin_file = F"{test_file}.bin"
        f_header = open(header_file,'r')
        header_line = f_header.readlines()[0]

        split = header_line.split(',')
        num_particles = int(split[0])
        time_steps = int(split[1])
        if split[5].find("True") == -1:
            has_nans = False
        else:
            has_nans = True

        data_size = num_particles*time_steps
        f_data = open(bin_file,'rb')
        lats_bin = f_data.read(data_size*2) # The two is because we are reading 2 bytes for each number (int16)
        lons_bin = f_data.read(data_size*2)
        # https://docs.python.org/3/library/struct.html
        lats_int = np.array(struct.unpack(F"{data_size}h", lats_bin), dtype=np.int16)
        lons_int = np.array(struct.unpack(F"{data_size}h", lons_bin), dtype=np.int16)
        lats = np.array([lats_int])[0]/100
        lons = np.array([lons_int])[0]/100
        # Reshape by timestep
        lats = np.reshape(lats, (num_particles, time_steps))
        lons = np.reshape(lons, (num_particles, time_steps))

        if has_nans:
        # if False:
            # Here we just need to read 1/8 of total because we store 8 values per byte
            read_size = int(np.ceil(data_size/8))  # Number of bytes to read
            disp_bin = f_data.read(read_size)
            data_int = struct.unpack(F"{read_size}B", disp_bin)

            disp_arr = np.zeros((num_particles,time_steps), dtype=bool)
            main_i = 0
            for c_part in range(num_particles):
                if c_part % 500 == 0:
                    print(c_part)
                for c_time in range(0, time_steps):
                    byte_idx = ((c_part*time_steps) + c_time) // 8
                    bin_mask = 2**(7 - (main_i % 8))
                    disp_arr[c_part][c_time] = (data_int[byte_idx] & bin_mask) > 0
                    main_i += 1

        f_data.close()
        f_header.close()

        # bbox = [min(lons.flatten()), max(lons.flatten()), min(lats.flatten()), max(lats.flatten())]
        for c_time in range(time_steps):
            c_lons = lons[:,c_time][disp_arr[:,c_time]]
            c_lats = lats[:,c_time][disp_arr[:,c_time]]
            bbox = [min(c_lons), max(c_lons), min(c_lats), max(c_lats)]
            fig, ax = plt.subplots(1, 1, figsize=(10,5), subplot_kw={'projection': ccrs.PlateCarree()})
            ax.set_extent(bbox)
            ax.stock_img()
            ax.scatter(c_lons, c_lats, s=1, color='r')
            ax.coastlines()
            plt.title(F"Time {c_time}")
            plt.show()

if __name__ == "__main__":
    config_file = "../ConfigExamples/Config_Test.json"
    f = open(config_file)
    config_json = json.load(f)

    from ParticleViz_DataPreproc.ConfigParams import ConfigParams
    config_obj = ConfigParams()  # Get Default parameters
    config_json = config_obj.get_config()
    mypreproc = PreprocParticleViz(config_json)
    # mypreproc.createBinaryFileMultiple()

    test_file = "../ExampleOutput/2/pviz_dataset 1_00"
    mypreproc.testBinaryAndHeaderFiles(test_file)