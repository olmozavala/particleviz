---
layout: default
title: Install
permalink: /install.html
---

## Python environment (uv)

ParticleViz uses [uv](https://docs.astral.sh/uv/) to manage its Python dependencies.

1. Install uv ([installation guide](https://docs.astral.sh/uv/getting-started/installation/)):

```shell
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. From the repository root, create the virtual environment and install packages:

```shell
cd particleviz
uv sync
```

This reads `pyproject.toml`, creates `.venv/`, and installs numpy, xarray, netCDF4, zarr, cartopy, and the other Python libraries needed for preprocessing.

3. Run commands through `uv run`:

```shell
uv run python ParticleViz.py --input_file ExampleData/Global_Marine_Debris.nc
```

### Development / tests

```shell
uv sync --extra dev
uv run pytest tests/
```

### Alternative: Conda

A legacy conda environment file is still available:

```shell
conda env create -f particleviz.yml
conda activate particleviz
```

## Docker

You can run ParticleViz in a container without installing Python or Node.js on your host. The image includes uv, the Python dependencies, `npm` packages for the web app, and the example data under `ExampleData/`.

### Build and run (default example)

From the repository root:

```shell
git clone https://github.com/olmozavala/particleviz.git
cd particleviz
docker build --pull --rm -f Dockerfile -t particleviz .
docker run --rm -it -p 3000:3000 particleviz:latest
```

The container runs preprocessing and starts the React dev server. Open **http://localhost:3000/** in your browser.

The default command (in `entrypoint.sh`) uses the bundled example:

```shell
uv run python ParticleViz.py --input_file ExampleData/Global_Marine_Debris.nc
```

### Use your own dataset

Mount a NetCDF or Zarr store into the container and override the command:

```shell
docker run --rm -it -p 3000:3000 \
  -v "$(pwd)/path/to/output.nc:/app/data/output.nc:ro" \
  particleviz:latest \
  uv run python ParticleViz.py --input_file /app/data/output.nc
```

For a Zarr directory:

```shell
docker run --rm -it -p 3000:3000 \
  -v "$(pwd)/path/to/output.zarr:/app/data/output.zarr:ro" \
  particleviz:latest \
  uv run python ParticleViz.py --input_file /app/data/output.zarr
```

### Use a config file

Mount a config and run the full pipeline:

```shell
docker run --rm -it -p 3000:3000 \
  -v "$(pwd)/ConfigExamples/Config_Simplest.json:/app/config.json:ro" \
  particleviz:latest \
  uv run python ParticleViz.py all --config_file /app/config.json
```

To change the default dataset baked into the image, edit `entrypoint.sh` before building, or pass a custom command as shown above.

## Building the docs site locally

From the repository root:

```shell
uv sync --extra dev
uv run python docs/build_site.py --local
python -m http.server 4000 --directory docs
```

Open **http://localhost:4000/**

### Preview like GitHub Pages (`/particleviz/` URLs)

This matches the compiled site deployed to **https://olmozavala.github.io/particleviz/**:

```shell
./scripts/serve_docs_github.sh
```

Or manually:

```shell
uv run python docs/build_site.py
ln -sfn docs particleviz
python -m http.server 4000
```

Open **http://localhost:4000/particleviz/**

### Publishing on GitHub Pages

Documentation is built and deployed automatically by GitHub Actions (`.github/workflows/docs.yml`) when changes are pushed to `main` under `docs/`.

1. In the repository settings, set **GitHub Pages → Build and deployment → Source: GitHub Actions**.

2. Push changes to markdown, layouts, or assets in `docs/`. The workflow runs `uv run python docs/build_site.py` and publishes the result.

The site will be available at **https://olmozavala.github.io/particleviz/**

To build locally with production URLs (`/particleviz/...`):

```shell
uv run python docs/build_site.py
```

Source markdown (`.md`) and `build_site.py` stay in `docs/` for editing; only the built HTML and static assets are deployed.

## JS dependencies (npm)

The web interface is a React app under `ParticleViz_WebApp/`. You need [Node.js](https://nodejs.org/) installed on your system.

The first time you run the web app, ParticleViz will call `npm install` automatically if `node_modules` is missing. You can also install manually:

```shell
cd ParticleViz_WebApp
npm install
```

<p><a href="{{ '/' | relative_url }}">Back to documentation home</a></p>
