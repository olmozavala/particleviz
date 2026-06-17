---
layout: default
title: Quick Start
---

## Quick Start

Once you have installed the [Python and JS dependencies](install.html), the simplest way to
use **ParticleViz** is to pass a trajectory dataset from the command line
(a `.nc` NetCDF file or a Zarr store directory).
You need to be patient the first time you run it because it will
install all the Javascript dependencies. It will be much faster after that.
This will generate the *default* web interface to display your data.

```shell
uv run python ParticleViz.py --input_file <path to dataset>
```

Test with the *Global_Marine_Debris.nc* example in *ExampleData*:

```shell
uv run python ParticleViz.py --input_file ExampleData/Global_Marine_Debris.nc
```

Or with a Zarr store:

```shell
uv run python ParticleViz.py --input_file /path/to/output.zarr
```

<img src="{{ '/media/quickstart.gif' | relative_url }}" alt="Quick start demonstration" class="demo-gif" />

For custom maps, multiple experiments, and styling options, see [Configuration](configuration.html) or the runnable [Examples](examples.html) for `ConfigExamples/` scenarios.

To run without a local Python/Node install, see [Docker](install.html#docker) on the Install page.
