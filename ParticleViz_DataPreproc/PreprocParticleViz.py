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
import pandas as pd


#New Zarr File Format - Neeraj Jawahirani

# ADD: Zarr/NC opener + long-table adapter
def open_any(file_path: str) -> xr.Dataset:
    if os.path.isdir(file_path) and file_path.lower().endswith(".zarr"):
        return xr.open_zarr(file_path)
    return xr.open_dataset(file_path)

def infer_time_meta_from_datetimes(time_values: np.ndarray):
    t = np.sort(pd.to_datetime(time_values).values)
    start = pd.to_datetime(t[0]).to_pydatetime().astimezone(tz=None)  # keep ISO; viz uses ISO string
    if len(t) > 1:
        diffs = np.diff(t).astype('timedelta64[s]').astype(float) / 3600.0
        delta_hours = float(np.median(diffs))
    else:
        delta_hours = 0.0
    return start.isoformat(), "hours", delta_hours

def longtable_to_wide(xr_ds: xr.Dataset,
                      pid_var="particle_id", time_var="time",
                      lat_var="lat", lon_var="lon"):
    df = xr_ds[[pid_var, time_var, lat_var, lon_var]].to_dataframe().reset_index(drop=True)
    df = df.dropna(subset=[pid_var, time_var, lat_var, lon_var]).copy()
    df[time_var] = pd.to_datetime(df[time_var])

    time_index = np.sort(df[time_var].unique())
    pids = np.sort(df[pid_var].unique())

    pid_to_row = {pid: i for i, pid in enumerate(pids)}
    n_p, n_t = len(pids), len(time_index)
    lat_2d = np.full((n_p, n_t), np.nan, dtype=np.float32)
    lon_2d = np.full((n_p, n_t), np.nan, dtype=np.float32)

    g = df.groupby(pid_var, sort=True)
    for pid, sub in g:
        r = pid_to_row[pid]
        sub = sub.sort_values(time_var)
        idx = np.searchsorted(time_index, sub[time_var].values)
        lat_2d[r, idx] = sub[lat_var].values.astype(np.float32, copy=False)
        lon_2d[r, idx] = sub[lon_var].values.astype(np.float32, copy=False)

    return lat_2d, lon_2d, time_index, pids

def load_particle_data_any(file_name: str):
    """
    Returns: lat_all (P×T), lon_all (P×T), times_all (T,),
             meta dict with start_date (ISO), delta_t_str ('hours'),
             delta_t (float hours), xr_ds
    """
    ds = open_any(file_name)

    # -----------------------
    # Case A: Zarr long-table
    # -----------------------
    if ("obs" in ds.dims) and all(v in ds.variables for v in ["particle_id","time","lat","lon"]):
        lat_all, lon_all, time_index, _ = longtable_to_wide(ds)
        start_iso, delta_t_str, delta_t = infer_time_meta_from_datetimes(time_index)
        return lat_all, lon_all, np.array(time_index), {
            "start_date": start_iso,
            "delta_t_str": delta_t_str,
            "delta_t": delta_t,
            "xr_ds": ds,
        }

    # -------------------------------
    # Case B: NetCDF classic 2-D (P×T)
    # -------------------------------
    lat_name = next((k for k in ds.variables if k.lower() in ("lat","latitude")), None)
    lon_name = next((k for k in ds.variables if k.lower() in ("lon","longitude")), None)

    if not (lat_name and lon_name):
        raise ValueError("Could not find 'lat'/'lon' variables in dataset")

    lat_da = ds[lat_name]
    lon_da = ds[lon_name]

    # infer particle vs time dims from the dataarray dims
    particle_dim_candidates = ("traj","trajectory","particle","particles","npart","id")
    time_dim_candidates     = ("time","obs","observation","step","t")

    dims = tuple(lat_da.dims)  # e.g., ('traj','obs')
    particle_dim = next((d for d in dims if d in particle_dim_candidates), None)
    time_dim = next((d for d in dims if (d != particle_dim) and (d in time_dim_candidates)), None)

    # fallback: if still missing and exactly 2 dims, assign by position
    if particle_dim is None and len(dims) == 2:
        particle_dim, time_dim = dims[0], dims[1]

    if (particle_dim is None) or (time_dim is None):
        raise ValueError(f"Could not infer particle/time dims from {dims}")

    # transpose to (particles, time)
    lat = lat_da.transpose(particle_dim, time_dim).data
    lon = lon_da.transpose(particle_dim, time_dim).data

    # derive a 1-D global time index
    if "time" in ds.variables:
        time_da = ds["time"]
        if time_da.ndim == 2:
            times_all = time_da.transpose(particle_dim, time_dim).isel({particle_dim: 0}).data
        elif time_dim in time_da.dims:
            times_all = time_da.data
        else:
            times_all = np.arange(lat.shape[1])
    else:
        times_all = np.arange(lat.shape[1])

    # compute time metadata
    if "time" in ds.variables and np.issubdtype(ds["time"].dtype, np.datetime64):
        start_iso, delta_t_str, delta_t = infer_time_meta_from_datetimes(times_all)
    elif "time" in ds.variables and "units" in ds["time"].attrs:
        units = ds["time"].attrs["units"]  # e.g., "hours since 2020-01-01 00:00:00"
        delta_t_str = units.split()[0] if units else "hours"
        base_str = units.split("since", 1)[1].strip() if "since" in units else None
        try:
            base_dt = pd.to_datetime(base_str).to_pydatetime() if base_str else pd.to_datetime(times_all[0]).to_pydatetime()
            tvals = ds["time"].transpose(particle_dim, time_dim).isel({particle_dim: 0}).values if ds["time"].ndim == 2 else ds["time"].values
            diffs = np.diff(tvals)
            if np.issubdtype(np.array(diffs).dtype, np.number):
                delta_t = float(np.median(diffs))
            else:
                diffs_h = (diffs.astype("timedelta64[s]").astype(float)) / 3600.0
                delta_t = float(np.median(diffs_h)) if diffs_h.size else 0.0
            start_iso = base_dt.isoformat()
        except Exception:
            start_iso, delta_t_str, delta_t = infer_time_meta_from_datetimes(times_all)
    else:
        start_iso, delta_t_str, delta_t = infer_time_meta_from_datetimes(times_all)

    return lat, lon, times_all, {
        "start_date": start_iso,
        "delta_t_str": delta_t_str,
        "delta_t": delta_t,
        "xr_ds": ds,
    }


############################################

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
            
            #### Neeraj jawahirani Changes
            # Unified loader (supports .nc and .zarr)
            lat_all, lon_all, times_all, meta = load_particle_data_any(file_name)
            start_date  = meta["start_date"]      # ISO string (e.g., '2025-01-01T00:00:00Z')
            delta_t_str = meta["delta_t_str"]     # usually 'hours'
            delta_t     = meta["delta_t"]         # numeric step (e.g., 1.0)
            glob_num_particles, tot_time_steps = lat_all.shape
            ##############################
            
            # Reading the output from Ocean Parcles
            #xr_ds = xr.open_dataset(file_name)
            #model_type = self.getOutputType(xr_ds)

            # This is only used to access time units string (TODO move everything to the NetCDF4 or Xarray library)
            #ds = Dataset(file_name)

            #tot_time_steps, glob_num_particles = self.getTotTimeStepsAndNumParticles(model_type, xr_ds)
            tot_files = (tot_time_steps + timesteps_by_file - 1) // timesteps_by_file

            # Here we update the total number of files generated for this
            advanced_dataset_model = {}
            advanced_dataset_model["total_files"] = tot_files
            advanced_dataset_model["name"] = model_name
            advanced_dataset_model["file_name"] = F"{self._file_prefix}_{model_name.strip().lower()}"

            print(F"Total number of timesteps: {tot_time_steps} Total number of particles: {glob_num_particles} ({tot_time_steps * glob_num_particles} positions, Number of files: {tot_files}) ")

            print("Verifying data boundaries...")
            #all_vars = xr_ds.variables
            # Print variables (debugging)
            # print("----- Variables Inside file ----")
            # for name in all_vars.keys():
            #     print(name)

            #lat_all = all_vars['lat'].data
            #lon_all = all_vars['lon'].data
            #times_all = all_vars['time'].data

            # Removing all values outside the 'earth' boundaries
            lat_all[lat_all > 91] = np.nan
            lat_all[lat_all < -91] = np.nan
            lon_all[lon_all < -361] = np.nan
            lon_all[lon_all > 361] = np.nan

            #time_units_str = ds.variables['time'].units.split(" ")
            # Compute the start date from the start unit and the first timestep

            #delta_t_str = time_units_str[0]
            #start_time = int(np.nanmin(ds['time']))  # Read the 'first time'
            #start_date = set_start_date(time_units_str[2], start_time, time_units_str[0])
            # here we assume we have at least 2 particles and the delta_t is constant
            #delta_t = 0.0
            #i_part = 0
            #print("Analyzing times of the particles....")
            # We look for a time delta within the particles first couple of times.
            #while delta_t == 0.0:
            #    if len(ds['time'].shape) > 1:
            #        delta_t = ds['time'][i_part,1] - ds['time'][i_part,0]
            #    else:
            #        delta_t = ds['time'][1] - ds['time'][0]
            #    i_part += 1

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
                
                if hasattr(lat, "compute"):  # dask array
                    lat = lat.compute()
                if hasattr(lon, "compute"):
                    lon = lon.compute()

                lat = np.asarray(lat)
                lon = np.asarray(lon)
                #if len(ds['time'].shape) > 1:
                #    times = times_all[::subsample_data, :]
                #else:
                #    times = times_all  # All particles have the same time
                times = times_all
                # ------ Fixing nans (replace nans with the last value of that particle)
                # It only works if the nans are at the end
                # Here it finds all the particles that finish with a nan value
                print("Searching for nans...")
                HAS_NANS = bool(np.isnan(lat).any())
                bit_display_array = np.logical_not(np.isnan(lat)).astype(np.bool_)
                if HAS_NANS:
                    print("NaNs present — display mask will be written.")
                else:
                    print("No NaNs found.")

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
            #xr_ds.close()

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