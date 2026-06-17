from typing import Dict, Any, Tuple
import os
import json
import zipfile
from os.path import join
import numpy as np
import cartopy.crs as ccrs
import matplotlib.pyplot as plt
import xarray as xr

from ParticleViz_DataPreproc.BinaryFormat import (
    decode_chunk,
    encode_dense_chunk,
    encode_ragged_chunk,
    experiment_slug,
    format_header,
    parse_header,
)
from ParticleViz_DataPreproc.PreprocConstants import ModelType
from ParticleViz_DataPreproc.ColorByParticleUtils import updateColorScheme
from ParticleViz_DataPreproc.DatasetLoader import (
    open_particle_dataset,
    normalize_trajectory_dims,
    get_time_metadata,
)


class PreprocParticleViz:
    """Preprocessor for ParticleViz data.

    Converts particle trajectory data (NetCDF or Zarr, OceanParcels/OpenDrift)
    into optimized binary formats for web visualization.
    """

    def __init__(self, config_json: Dict[str, Any]):
        """Initialize PreprocParticleViz with configuration.

        Args:
            config_json: The configuration parameters.
        """
        config = config_json["preprocessing"]
        config_adv = config_json["advanced"]
        self._config_json = config_json
        self._experiments = config["experiments"]
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
        var_names = set(xr_ds.variables.keys()) | set(xr_ds.dims)
        if {'obs', 'traj', 'lon', 'lat', 'z', 'time'}.issubset(var_names):
            return ModelType.OCEAN_PARCELS
        if {'obs', 'trajectory', 'lon', 'lat', 'z', 'time'}.issubset(var_names):
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
            if "traj" in xr_ds.sizes:
                return int(xr_ds.sizes["time"]), int(xr_ds.sizes["traj"])
            if "trajectory" in xr_ds.sizes:
                return int(xr_ds.sizes["time"]), int(xr_ds.sizes["trajectory"])
            return int(xr_ds.sizes["time"]), 1

        if model_type == ModelType.OCEAN_PARCELS:
            return xr_ds.obs.size, xr_ds.traj.size

        return xr_ds.obs.size, xr_ds.traj.size

    def createBinaryFileMultiple(self) -> None:
        """Create binary and text files for subsampled particle data.

        Iterates over experiments, subsamples them for Desktop/Mobile, and saves
        partitioned binary chunks ready for the web app.
        """
        timesteps_by_file = self._timesteps_by_file
        self._config_json["advanced"]["datasets"] = []

        print("Reading data...")
        for id_m, c_experiment in enumerate(self._experiments):
            experiment_name = c_experiment["name"]
            file_name = c_experiment["file_name"]

            xr_ds = normalize_trajectory_dims(open_particle_dataset(file_name))
            model_type = self.getOutputType(xr_ds)
            time_meta = get_time_metadata(xr_ds)

            tot_time_steps, glob_num_particles = self.getTotTimeStepsAndNumParticles(model_type, xr_ds)
            tot_files = (tot_time_steps // timesteps_by_file) + 1

            slug = experiment_slug(experiment_name)
            experiment_output_folder = join(self._output_folder, slug)
            advanced_dataset_entry = {
                "total_files": tot_files,
                "name": experiment_name,
                "data_folder": slug,
                "file_name": f"{self._file_prefix}_{slug}"
            }

            print(f"Total timesteps: {tot_time_steps}, Particles: {glob_num_particles}, Files: {tot_files}")

            print("Verifying data boundaries...")
            lat_all = np.asarray(xr_ds["lat"].values)
            lon_all = np.asarray(xr_ds["lon"].values)
            times_all = np.asarray(xr_ds["time"].values)

            # Earth boundaries check
            lat_all[lat_all > 91] = np.nan
            lat_all[lat_all < -91] = np.nan
            lon_all[lon_all < -361] = np.nan
            lon_all[lon_all > 361] = np.nan

            start_date = time_meta.start_date
            delta_t = time_meta.delta_t

            subsample_levels = [c_experiment['subsample'].get('desktop', 2),
                               c_experiment['subsample'].get('mobile', 4)]

            if 'color_scheme' in c_experiment:
                updateColorScheme(id_m, c_experiment['color_scheme'], subsample_levels,
                                  experiment_output_folder, num_part=len(lat_all))
                advanced_dataset_entry["color_scheme"] = f"{id_m}_{os.path.basename(c_experiment['color_scheme'])}"

            advanced_dataset_entry["subsample"] = {
                "desktop": subsample_levels[0],
                "mobile": subsample_levels[1]
            }
            self._config_json["advanced"]["datasets"].append({experiment_name: advanced_dataset_entry})

            print("Subsampling for desktop and mobile versions..")
            for subsample_data in subsample_levels:
                final_output_folder = join(experiment_output_folder, str(subsample_data))
                if not os.path.exists(final_output_folder):
                    os.makedirs(final_output_folder)

                lat = lat_all[::subsample_data, :]
                lon = lon_all[::subsample_data, :]
                times = times_all[::subsample_data, :] if time_meta.is_per_particle else times_all

                print("Searching for nans...")
                has_nans = np.isnan(lat).any().item()
                bit_display_array = None
                if has_nans:
                    print("Analyzing nan values ....")
                    if time_meta.is_per_particle:
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
                    chunk_steps = next_step - cur_chunk
                    lat_chunk = lat[:, cur_chunk:next_step]
                    lon_chunk = lon[:, cur_chunk:next_step]
                    use_ragged = has_nans and bit_display_array is not None
                    if use_ragged:
                        visible_chunk = bit_display_array[:, cur_chunk:next_step]
                        bindata = encode_ragged_chunk(lat_chunk, lon_chunk, visible_chunk)
                    else:
                        bindata = encode_dense_chunk(lat_chunk, lon_chunk)

                    header_txt = format_header(
                        len(lat),
                        chunk_steps,
                        start_date,
                        time_meta.unit,
                        delta_t,
                        has_nans,
                        use_ragged,
                    )

                    out_name = advanced_dataset_entry["file_name"]
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

    def testBinaryAndHeaderFiles(self, test_file_base: str) -> None:
        """Read and visualize a processed binary file.

        Args:
            test_file_base: The base path to the file (without .txt/.bin).
        """
        header_file = f"{test_file_base.replace('.txt', '').replace('.bin', '')}.txt"
        bin_file = f"{test_file_base}.bin"

        with open(header_file, 'r') as f_h:
            num_particles, time_steps, _, _, _, has_nans, ragged = parse_header(f_h.readline())

        with open(bin_file, 'rb') as f_d:
            lats, lons, disp_arr = decode_chunk(
                f_d.read(),
                num_particles,
                time_steps,
                has_nans,
                ragged,
            )

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