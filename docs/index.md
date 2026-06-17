---
layout: default
title: ParticleViz
---

<section class="page-hero" aria-labelledby="hero-title">
  <img
    class="page-hero__logo"
    src="{{ '/logos/28012022_ParticleViz.png' | relative_url }}"
    alt="ParticleViz"
    width="288"
    height="auto"
  >
  <p id="hero-title" class="page-hero__tagline">
    Visualizing Lagrangian model outputs the easy way.
  </p>
  <div class="page-hero__actions">
    <a class="btn btn--demo" href="https://ozavala.coaps.fsu.edu/particleviz/GlobalLitter/" target="_blank" rel="noopener noreferrer">Live Demo</a>
    <a class="btn btn--github" href="https://github.com/olmozavala/particleviz" target="_blank" rel="noopener noreferrer">GitHub</a>
  </div>
</section>

## Welcome to ParticleViz

<p class="hero-lead">
ParticleViz is an Open Source software that is used to
visualize large number of particles inside dynamic web maps.
It is designed mostly for Earth Science scientists
that simulate different processes using Lagrangian models.
</p>

The objectives of this software are:
* Provide efficient visualizations that can help analyze and understand research made
through lagrangian modelling in the Earth Sciences, in a fast and easy way. 
* Make it easy to share this research with other colleagues with selfcontained
websites. 

**ParticleViz** reads particle trajectory data in **NetCDF** or **Zarr** format. Inputs from [OceanParcels](https://oceanparcels.org/) and [OpenDrift](https://opendrift.github.io/) are recognized automatically; any dataset that follows the same variable naming convention also works.

## Supported input formats

ParticleViz expects Lagrangian particle trajectories with latitude, longitude, and time coordinates. You can point `file_name` (in a config file) or `--input_file` (CLI) at:

| Format | Example path | Notes |
|--------|--------------|-------|
| NetCDF | `model_output.nc` | `.nc` files from OceanParcels, OpenDrift, or compatible exports |
| Zarr | `model_output.zarr/` | Zarr store directory (e.g. OceanParcels Zarr output) |

**OceanParcels convention:** variables such as `lon`, `lat`, `time`, `obs`, and `traj` (or `trajectory` for some Zarr exports).

**OpenDrift convention:** variables such as `lon`, `lat`, `time`, and `trajectory`.

If global metadata does not identify the model, ParticleViz falls back to these variable-name patterns. Custom outputs that match the same layout can be visualized without extra configuration.

## Status

<div class="status-badges">
<a href="https://github.com/olmozavala/particleviz/stargazers"><img src="https://img.shields.io/github/stars/olmozavala/particleviz?style=social" alt="GitHub stars"></a>
<a href="https://github.com/olmozavala/particleviz/blob/main/LICENSE"><img src="https://img.shields.io/github/license/olmozavala/particleviz" alt="License"></a>
<a href="https://github.com/olmozavala/particleviz/releases"><img src="https://img.shields.io/github/downloads/olmozavala/particleviz/total" alt="Downloads"></a>
<a href="https://github.com/olmozavala/particleviz/issues"><img src="https://img.shields.io/github/issues/olmozavala/particleviz" alt="Issues"></a>
<a href="https://github.com/olmozavala/particleviz/pulse"><img src="https://img.shields.io/github/commit-activity/m/olmozavala/particleviz" alt="Commit activity"></a>
</div>

## Get started

<div class="doc-cards">

<a class="doc-card" href="{{ '/install.html' | relative_url }}">
  <h3>Install</h3>
  <p>Set up Python (uv), Node.js, and optional development tools.</p>
</a>

<a class="doc-card" href="{{ '/quick-start.html' | relative_url }}">
  <h3>Quick Start</h3>
  <p>Run ParticleViz on an example dataset in a few commands.</p>
</a>

<a class="doc-card" href="{{ '/showcases.html' | relative_url }}">
  <h3>Showcases</h3>
  <p>Explore published research visualizations built with ParticleViz.</p>
</a>

<a class="doc-card" href="{{ '/examples.html' | relative_url }}">
  <h3>Examples</h3>
  <p>Run bundled <code>ConfigExamples/</code> with <code>ExampleData/Global_Marine_Debris.nc</code> (see <a href="examples.html">Examples</a>).</p>
</a>

<a class="doc-card" href="{{ '/configuration.html' | relative_url }}">
  <h3>Configuration</h3>
  <p>Customize preprocessing and the web interface with JSON config files.</p>
</a>

</div>
