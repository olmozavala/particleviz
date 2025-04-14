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
from ParticleViz_DataPreproc.PreprocConstants import ModelType
from ParticleViz_DataPreproc.ColorByParticleUtils import updateColorScheme

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


    def getOutputType(self, xr_ds):
        '''
        Identifies the type of output that is in the netcdf file. Current accepted formats are: OceanParcels and OpenDrift
        :param xr_ds:
        :return:
        '''
        attrs = list(xr_ds.attrs.keys())
        if np.any([x.find('opendrift') != -1 for x in attrs]):
            return ModelType.OPEN_DRIFT
        if np.any([x.find('parcels') != -1 for x in attrs]):
            return ModelType.OCEAN_PARCELS
        
        # Heuristics for zarr structure - check variable names
        var_names = list(xr_ds.variables.keys())
        if {'obs', 'traj', 'lon', 'lat', 'z', 'time'}.issubset(set(var_names)):
            return ModelType.OCEAN_PARCELS
        if {'trajectory', 'time', 'lon', 'lat'}.issubset(set(var_names)):
            return ModelType.OPEN_DRIFT
        # TODO Throw an exception

    def getTotTimeStepsAndNumParticles(self, model_type, xr_ds):
        if model_type == ModelType.OPEN_DRIFT:
            return xr_ds.trajectory.size, xr_ds.time.size

        if model_type == ModelType.OCEAN_PARCELS:
            return xr_ds.obs.size, xr_ds.traj.size

        print("WARNING: The file type format was not identified (OceanParcels nor OpenDrift). Assuming OceanParcels type")
        return xr_ds.obs.size, xr_ds.traj.size

    def createBinaryFileMultiple(self):
        """
        Creates binary and text files corresponding to the desired 'subsampled' number of particles
        :return:
        """
        timesteps_by_file = self._timesteps_by_file# How many locations to save in each file

        self._config_json["advanced"]["datasets"] = []

        print("Reading data...")
        # Iterate over all the specified models
        for id, c_model in enumerate(self._models):
            model_name = c_model["name"]
            file_name = c_model["file_name"]
            # Reading the output from Ocean Parcles
            xr_ds = xr.open_dataset(file_name)
            model_type = self.getOutputType(xr_ds)

            # This is only used to access time units string (TODO move everything to the NetCDF4 or Xarray library)
            ds = Dataset(file_name)

            tot_time_steps, glob_num_particles = self.getTotTimeStepsAndNumParticles(model_type, xr_ds)
            tot_files = tot_time_steps//timesteps_by_file + 1

            # Here we update the total number of files generated for this
            advanced_dataset_model = {}
            advanced_dataset_model["total_files"] = tot_files
            advanced_dataset_model["name"] = model_name
            advanced_dataset_model["file_name"] = F"{self._file_prefix}_{model_name.strip().lower()}"

            print(F"Total number of timesteps: {tot_time_steps} Total number of particles: {glob_num_particles} ({tot_time_steps * glob_num_particles} positions, Number of files: {tot_files}) ")

            print("Verifying data boundaries...")
            all_vars = xr_ds.variables
            # Print variables (debugging)
            # print("----- Variables Inside file ----")
            # for name in all_vars.keys():
            #     print(name)

            lat_all = all_vars['lat'].data
            lon_all = all_vars['lon'].data
            times_all = all_vars['time'].data

            # Removing all values outside the 'earth' boundaries
            lat_all[lat_all > 91] = np.nan
            lat_all[lat_all < -91] = np.nan
            lon_all[lon_all < -361] = np.nan
            lon_all[lon_all > 361] = np.nan

            time_units_str = ds.variables['time'].units.split(" ")
            # Compute the start date from the start unit and the first timestep

            delta_t_str = time_units_str[0]
            start_time = int(np.nanmin(ds['time']))  # Read the 'first time'
            start_date = set_start_date(time_units_str[2], start_time, time_units_str[0])
            # TODO here we assume we have at least 2 particles and the delta_t is constant
            delta_t = 0.0
            i_part = 0
            print("Analyzing times of the particles....")
            # We look for a time delta within the particles first couple of times.
            while delta_t == 0.0:
                if len(ds['time'].shape) > 1:
                    delta_t = ds['time'][i_part,1] - ds['time'][i_part,0]
                else:
                    delta_t = ds['time'][1] - ds['time'][0]
                i_part += 1

            # Iterate over the options to reduce the number of particles
            subsample_model = [2, 4]  # Default values are 2 and 4
            if 'desktop' in c_model['subsample'].keys():
                subsample_model[0] = c_model['subsample']['desktop']
            if 'mobile' in c_model['subsample'].keys():
                subsample_model[1] = c_model['subsample']['mobile']
            if 'color_scheme' in c_model.keys():
                # We need to create one ending with Desktop and one ending with Mobile
                updateColorScheme(id, c_model['color_scheme'], subsample_model, self._output_folder, num_part=len(lat_all))
                advanced_dataset_model["color_scheme"] = f"{id}_{os.path.basename(c_model['color_scheme'])}"

            advanced_dataset_model["subsample"] = {}
            advanced_dataset_model["subsample"]["desktop"] = subsample_model[0]
            advanced_dataset_model["subsample"]["mobile"] = subsample_model[1]
            # Here we include the dataset into the 'advanced' settings
            self._config_json["advanced"]["datasets"].append({model_name: advanced_dataset_model})

            # Generating the binary files for the 'Desktop' and 'Mobile'
            print("Subsampling for desktop and mobile versions..")
            for subsample_data in subsample_model:
                final_ouput_folder = F"{self._output_folder}/{subsample_data}"
                if not(os.path.exists(final_ouput_folder)):
                    os.makedirs(final_ouput_folder)

                # Subsampled locations
                lat = lat_all[::subsample_data, :]
                lon = lon_all[::subsample_data, :]
                if len(ds['time'].shape) > 1:
                    times = times_all[::subsample_data, :]
                else:
                    times = times_all  # All particles have the same time

                # ------ Fixing nans (replace nans with the last value of that particle)
                # It only works if the nans are at the end
                # Here it finds all the particles that finish with a nan value
                print("Searching for nans...")
                # Replacing some values with nans
                HAS_NANS = np.isnan(lat).any().item()
                if HAS_NANS:
                    # Here we align all the particles to have the same times. For those that start at a later time
                    # we shift them to start at the first time, filling with nans all the previous timesteps
                    # TODO this only works if ALL the particles 'move' with the same dt. If some particles move
                    # at even days and other particles at odd days, then this will not work.
                    print("Analyzing nan values ....")
                    bit_display_array = np.ones(lat.shape, dtype=bool)

                    # Now it verifies the time of the particle
                    if len(ds['time'].shape) > 1:
                        # Identify the start time for each particle (compare vs time of first particle)
                        try:
                            shifted_particles = np.where(times[:,0] > times[0,0])[0]
                            for idx, c_part in enumerate(shifted_particles): # For each particle with nans
                                shift_amount = np.argmax(np.where(times[c_part, 0] > times[0, :])[0]) + 1
                                if idx % 1000 == 0:
                                    print(F"Particle {c_part} of shifting {shift_amount} timesteps")
                                # Re-align vectors so that the times matches between all the particles
                                lat[c_part,:] = np.roll(lat[c_part, :], shift_amount)
                                lon[c_part,:] = np.roll(lon[c_part, :], shift_amount)
                        except Exception as e:
                            print("No need to shift particles")

                    bit_display_array = np.logical_not(np.isnan(lat))
                    print("Done!")

                # TODO in our current solution, when particles do not share the same time (for example,
                # particle 1 has times at 0 and 12 but particle 2 has times at 6 and 18, then we arbitrary
                # choose one of the two)

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
            xr_ds.close()

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