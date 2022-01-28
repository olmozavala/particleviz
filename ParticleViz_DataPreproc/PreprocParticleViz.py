import struct
__author__="Olmo S. Zavala Romero"

import numpy as np
from netCDF4 import Dataset
import xarray as xr
import os
import json
import zipfile
import cartopy.crs as ccrs
import matplotlib.pyplot as plt

class PreprocParticleViz:
    def __init__(self, config_file):
        f = open(config_file)
        config_json = json.load(f)
        config = config_json["preprocessing"]
        config_adv = config_json["advanced"]
        self._config_file = config_file
        self._config_json = config_json
        self._input_file = config["input_file"]  # This is the OceanParcel file
        self._output_folder = config["output_folder"]
        self._subsample_all = config["subsample"]  # If we want to subsample the number of particles in the file
        self._timesteps_by_file = config_adv["timesteps_by_file"]  # How many timesteps do we want to store in each binary file
        self._file_prefix = config_adv["file_prefix"]  # Output file name to use by ParticleViz

    def createBinaryFileMultiple(self):
        """
        Creates binary and text files corresponding to the desired 'subsampled' number of particles
        :return:
        """
        subsample_data_all = self._subsample_all
        timesteps_by_file = self._timesteps_by_file# How many locations to save in each file

        def myfmt(r): # 'Round to 2 decimals'
            return float(F"{r:.2f}")

        vecfmt = np.vectorize(myfmt)

        print("Reading data...")
        # Reading the output from Ocean Parcles
        nc_file = xr.open_dataset(self._input_file)
        # This is only used to access time units string (TODO move everything to the NetCDF4 library)
        ds = Dataset(self._input_file)

        tot_time_steps = nc_file.obs.size
        glob_num_particles = nc_file.traj.size
        tot_files = tot_time_steps//timesteps_by_file + 1

        # Here we update the total number of files generated for this
        self._config_json["advanced"]["total_files"] = tot_files
        with open(self._config_file, 'w') as f:
            json.dump(self._config_json, f, indent=4)

        print(F"Total number of timesteps: {tot_time_steps} Total number of particles: {glob_num_particles} ({tot_time_steps * glob_num_particles} positions, Number of files: {tot_files}) ")

        # Print variables
        print("----- Variables Inside file ----")
        all_vars = nc_file.variables
        for name in all_vars.keys():
            print(name)

        lat_all = all_vars['lat']
        lon_all = all_vars['lon']

        time_units_str = ds.variables['time'].units.split(" ")
        start_date = time_units_str[2]
        delta_t = time_units_str[0]

        # Iterate over the options to reduce the number of particles
        for subsample_data in subsample_data_all:

            final_ouput_folder = F"{self._output_folder}/{subsample_data}"
            if not(os.path.exists(final_ouput_folder)):
                os.makedirs(final_ouput_folder)

            # Subsampled locations
            lat = lat_all[::subsample_data, :]
            lon = lon_all[::subsample_data, :]

            # Iterate over the number of partitioned files (how many files are we going to create)
            for ichunk, cur_chunk in enumerate(np.arange(0, tot_time_steps, timesteps_by_file)):

                next_time_step = int(min(cur_chunk+timesteps_by_file, tot_time_steps))
                # Add the particles for this file. Here we are reducing the precision of the positions
                this_file = {'lat_lon': [vecfmt(lat[:, cur_chunk:next_time_step]),
                                         vecfmt(lon[:, cur_chunk:next_time_step])]}

                # # ------------- Writing the binary file form the countries object --------------
                bindata = b''
                # num_particles, num_timesteps, start_date, delta_t
                header_txt = F"{len(this_file['lat_lon'][0])}, {len(this_file['lat_lon'][0][0])}, {start_date}, {delta_t}\n"
                # Here we reduce transform to 16 bit integer
                # Limits for int16 are -32768 to 32767
                bindata += (np.array(this_file['lat_lon'][0])*100).astype(np.int16).tobytes()
                bindata += (np.array(this_file['lat_lon'][1])*100).astype(np.int16).tobytes()

                output_file_name = self._file_prefix
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

        f_data = open(bin_file,'rb')
        split = header_line.split(',')
        num_particles = int(split[0])
        time_steps = int(split[1])

        lats_bin = f_data.read(num_particles*time_steps*2)
        lons_bin = f_data.read(num_particles*time_steps*2)
        lats_int = struct.unpack(F"{num_particles*time_steps}h", lats_bin)
        lons_int = struct.unpack(F"{num_particles*time_steps}h", lons_bin)
        lats = np.array([lats_int])[0]/100
        lons = np.array([lons_int])[0]/100

        f_data.close()
        f_header.close()

        bbox = [min(lons), max(lons), min(lats), max(lats)]
        ax = plt.axes(projection=ccrs.PlateCarree())
        ax.set_extent(bbox)
        ax.gridlines()
        ax.scatter(lons, lats)
        ax.coastlines()
        plt.title(F"Total number of particles {len(lats)}")
        plt.show()


if __name__ == "__main__":
    config_file = "../Config.json"
    # test_file = "../ExampleOutput/3/ParticleViz_01"
    mypreproc = PreprocParticleViz(config_file)
    mypreproc.createBinaryFileMultiple()
    # mypreproc.testBinaryAndHeaderFiles(test_file)
