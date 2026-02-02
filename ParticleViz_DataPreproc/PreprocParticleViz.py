from typing import Dict, Any, Tuple, Optional, List
import struct
import os
import json
import zipfile
from os.path import join
from datetime import datetime, timedelta
from dateutil.parser import isoparse
import numpy as np
from netCDF4 import Dataset
import xarray as xr
import cartopy.crs as ccrs
import matplotlib.pyplot as plt

from ParticleViz_DataPreproc.PreprocConstants import ModelType
from ParticleViz_DataPreproc.ColorByParticleUtils import updateColorScheme

__author__ = "Olmo S. Zavala Romero"


def set_start_date(start_date_str: str, start_time: int, units: str) -> datetime:
    """Set the initial start date/time of the model.

    Takes into account the 'units' property of the NetCDF and the minimum value
    in the 'time' variable of the NetCDF.

    Args:
        start_date_str: Initial date string from NetCDF units.
        start_time: Offset value from the NetCDF time variable.
        units: Unit of the offset (seconds, hours, days).

    Returns:
        The calculated start datetime object.
    """
    base_date = isoparse(start_date_str)
    if units == 'seconds':
        return base_date + timedelta(seconds=float(start_time))
    if units == 'hours':
        return base_date + timedelta(hours=float(start_time))
    if units == 'days':
        return base_date + timedelta(days=float(start_time))
    return base_date


class PreprocParticleViz:
    """Preprocessor for ParticleViz data.

    Converts NetCDF particle data (OceanParcels/OpenDrift) into optimized
    binary formats for web visualization.
    """

    def __init__(self, config_json: Dict[str, Any]):
        """Initialize PreprocParticleViz with configuration.

        Args:
            config_json: The configuration parameters.
        """
        config = config_json["preprocessing"]
        config_adv = config_json["advanced"]
        self._config_json = config_json
        self._models = config["models"]
        self._output_folder = config["output_folder"]
        self._timesteps_by_file = config_adv["timesteps_by_file"]
        self._file_prefix = config_adv["file_prefix"]

    def getOutputType(self, xr_ds: xr.Dataset) -> ModelType:
        """Identify the type of output in the NetCDF file.

        Args:
            xr_ds: Xarray dataset to analyze.

        Returns:
            The detected ModelType.
        """
        attrs = list(xr_ds.attrs.keys())
        if any('opendrift' in x.lower() for x in attrs):
            return ModelType.OPEN_DRIFT
        if any('parcels' in x.lower() for x in attrs):
            return ModelType.OCEAN_PARCELS

        # Heuristics for zarr or other structures
        var_names = set(xr_ds.variables.keys())
        if {'obs', 'traj', 'lon', 'lat', 'z', 'time'}.issubset(var_names):
            return ModelType.OCEAN_PARCELS
        if {'trajectory', 'time', 'lon', 'lat'}.issubset(var_names):
            return ModelType.OPEN_DRIFT

        print("WARNING: Model type not clearly identified. Defaulting to OceanParcels.")
        return ModelType.OCEAN_PARCELS

    def getTotTimeStepsAndNumParticles(self, model_type: ModelType, xr_ds: xr.Dataset) -> Tuple[int, int]:
        """Get total timesteps and number of particles for a model.

        Args:
            model_type: The type of the model (OceanParcels/OpenDrift).
            xr_ds: Xarray dataset.

        Returns:
            A tuple (total_timesteps, global_num_particles).
        """
        if model_type == ModelType.OPEN_DRIFT:
            return xr_ds.trajectory.size, xr_ds.time.size

        if model_type == ModelType.OCEAN_PARCELS:
            return xr_ds.obs.size, xr_ds.traj.size

        return xr_ds.obs.size, xr_ds.traj.size

    def createBinaryFileMultiple(self) -> None:
        """Create binary and text files for subsampled particle data.

        Iterates over models, subsamples them for Desktop/Mobile, and saves
        partitioned binary chunks ready for the web app.
        """
        timesteps_by_file = self._timesteps_by_file
        self._config_json["advanced"]["datasets"] = []

        print("Reading data...")
        for id_m, c_model in enumerate(self._models):
            model_name = c_model["name"]
            file_name = c_model["file_name"]

            xr_ds = xr.open_dataset(file_name)
            model_type = self.getOutputType(xr_ds)
            ds = Dataset(file_name)

            tot_time_steps, glob_num_particles = self.getTotTimeStepsAndNumParticles(model_type, xr_ds)
            tot_files = (tot_time_steps // timesteps_by_file) + 1

            advanced_dataset_model = {
                "total_files": tot_files,
                "name": model_name,
                "file_name": f"{self._file_prefix}_{model_name.strip().lower()}"
            }

            print(f"Total timesteps: {tot_time_steps}, Particles: {glob_num_particles}, Files: {tot_files}")

            print("Verifying data boundaries...")
            all_vars = xr_ds.variables
            lat_all = all_vars['lat'].data
            lon_all = all_vars['lon'].data
            times_all = all_vars['time'].data

            # Earth boundaries check
            lat_all[lat_all > 91] = np.nan
            lat_all[lat_all < -91] = np.nan
            lon_all[lon_all < -361] = np.nan
            lon_all[lon_all > 361] = np.nan

            time_var = ds.variables['time']
            time_units_str = time_var.units.split(" ")
            start_time = int(np.nanmin(ds['time']))
            start_date = set_start_date(time_units_str[2], start_time, time_units_str[0])

            delta_t = 0.0
            i_part = 0
            print("Analyzing times of the particles....")
            while delta_t == 0.0:
                if len(ds['time'].shape) > 1:
                    delta_t = ds['time'][i_part, 1] - ds['time'][i_part, 0]
                else:
                    delta_t = ds['time'][1] - ds['time'][0]
                i_part += 1

            subsample_model = [c_model['subsample'].get('desktop', 2),
                               c_model['subsample'].get('mobile', 4)]

            if 'color_scheme' in c_model:
                updateColorScheme(id_m, c_model['color_scheme'], subsample_model,
                                  self._output_folder, num_part=len(lat_all))
                advanced_dataset_model["color_scheme"] = f"{id_m}_{os.path.basename(c_model['color_scheme'])}"

            advanced_dataset_model["subsample"] = {
                "desktop": subsample_model[0],
                "mobile": subsample_model[1]
            }
            self._config_json["advanced"]["datasets"].append({model_name: advanced_dataset_model})

            print("Subsampling for desktop and mobile versions..")
            for subsample_data in subsample_model:
                final_output_folder = join(self._output_folder, str(subsample_data))
                if not os.path.exists(final_output_folder):
                    os.makedirs(final_output_folder)

                lat = lat_all[::subsample_data, :]
                lon = lon_all[::subsample_data, :]
                times = times_all[::subsample_data, :] if len(ds['time'].shape) > 1 else times_all

                print("Searching for nans...")
                has_nans = np.isnan(lat).any().item()
                bit_display_array = None
                if has_nans:
                    print("Analyzing nan values ....")
                    if len(ds['time'].shape) > 1:
                        try:
                            # Shift particles that don't start at time 0
                            shifted_particles = np.where(times[:, 0] > times[0, 0])[0]
                            for idx, c_part in enumerate(shifted_particles):
                                shift_amount = np.argmax(np.where(times[c_part, 0] > times[0, :])[0]) + 1
                                if idx % 1000 == 0:
                                    print(f"Shifting particle {c_part} by {shift_amount} steps")
                                lat[c_part, :] = np.roll(lat[c_part, :], shift_amount)
                                lon[c_part, :] = np.roll(lon[c_part, :], shift_amount)
                        except Exception:
                            print("No need to shift particles")
                    bit_display_array = np.logical_not(np.isnan(lat))

                for ichunk, cur_chunk in enumerate(range(0, tot_time_steps, timesteps_by_file)):
                    print(f"Working with file {ichunk}...")
                    next_step = min(cur_chunk + timesteps_by_file, tot_time_steps)

                    bindata = b''
                    header_txt = f"{len(lat)}, {next_step - cur_chunk}, {start_date}, {time_units_str[0]}, {delta_t}, {has_nans}\n"

                    # Convert to int16 (scaled by 100)
                    bindata += (lat[:, cur_chunk:next_step] * 100).astype(np.int16).tobytes()
                    bindata += (lon[:, cur_chunk:next_step] * 100).astype(np.int16).tobytes()

                    if has_nans and bit_display_array is not None:
                        bindata += np.packbits(bit_display_array[:, cur_chunk:next_step]).tobytes()

                    out_name = advanced_dataset_model["file_name"]
                    header_file = join(final_output_folder, f"{out_name}_{ichunk:02d}.txt")
                    binary_file = join(final_output_folder, f"{out_name}_{ichunk:02d}.bin")
                    zip_file_path = join(final_output_folder, f"{out_name}_{ichunk:02d}.zip")

                    with open(header_file, 'w') as f_h:
                        f_h.write(header_txt)
                    with open(binary_file, 'wb') as f_b:
                        f_b.write(bindata)

                    print(f"Saving zip file: {zip_file_path}")
                    with zipfile.ZipFile(zip_file_path, 'w') as zf:
                        zf.write(binary_file, arcname=os.path.basename(binary_file))
                    os.remove(binary_file)

            with open("Current_Config.json", 'w') as f_conf:
                json.dump(self._config_json, f_conf, indent=4)
            xr_ds.close()
            ds.close()

    def testBinaryAndHeaderFiles(self, test_file_base: str) -> None:
        """Read and visualize a processed binary file.

        Args:
            test_file_base: The base path to the file (without .txt/.bin).
        """
        header_file = f"{test_file_base.replace('.txt', '').replace('.bin', '')}.txt"
        bin_file = f"{test_file_base}.bin"

        with open(header_file, 'r') as f_h:
            header_line = f_h.readlines()[0]

        parts = header_line.split(',')
        num_particles = int(parts[0])
        time_steps = int(parts[1])
        has_nans = "True" in parts[5]

        data_size = num_particles * time_steps
        with open(bin_file, 'rb') as f_d:
            lats_bin = f_d.read(data_size * 2)
            lons_bin = f_d.read(data_size * 2)

            lats = np.array(struct.unpack(f"{data_size}h", lats_bin)).reshape(num_particles, time_steps) / 100
            lons = np.array(struct.unpack(f"{data_size}h", lons_bin)).reshape(num_particles, time_steps) / 100

            disp_arr = np.ones((num_particles, time_steps), dtype=bool)
            if has_nans:
                read_size = int(np.ceil(data_size / 8))
                disp_bin = f_d.read(read_size)
                data_int = struct.unpack(f"{read_size}B", disp_bin)

                main_i = 0
                for c_part in range(num_particles):
                    for c_time in range(time_steps):
                        byte_idx = ((c_part * time_steps) + c_time) // 8
                        bin_mask = 2 ** (7 - (main_i % 8))
                        disp_arr[c_part][c_time] = (data_int[byte_idx] & bin_mask) > 0
                        main_i += 1

        for c_time in range(time_steps):
            c_lons = lons[:, c_time][disp_arr[:, c_time]]
            c_lats = lats[:, c_time][disp_arr[:, c_time]]
            if len(c_lons) == 0:
                continue
            bbox = [min(c_lons), max(c_lons), min(c_lats), max(c_lats)]
            fig, ax = plt.subplots(1, 1, figsize=(10, 5), subplot_kw={'projection': ccrs.PlateCarree()})
            ax.set_extent(bbox)
            ax.stock_img()
            ax.scatter(c_lons, c_lats, s=1, color='r')
            ax.coastlines()
            plt.title(f"Time {c_time}")
            plt.show()


if __name__ == "__main__":
    from ParticleViz_DataPreproc.ConfigParams import ConfigParams
    config_obj = ConfigParams()
    preproc = PreprocParticleViz(config_obj.get_config())
    # Example usage:
    # preproc.createBinaryFileMultiple()
    # preproc.testBinaryAndHeaderFiles("../ExampleOutput/2/pviz_dataset 1_00")