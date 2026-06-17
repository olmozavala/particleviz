# Building the ParticleViz docs site

For agents maintaining this repository. End users do not need this.

## Prerequisites

From the repository root:

```shell
uv sync --extra dev
```

## Local preview (root URLs)

Build with `baseurl /` and serve from `docs/`:

```shell
uv run python docs/build_site.py --local
python -m http.server 4000 --directory docs
```

Open http://localhost:4000/

Shortcut: `./agent_scripts/serve_docs.sh [port]`

## Preview like GitHub Pages (`/particleviz/` URLs)

Matches https://olmozavala.github.io/particleviz/:

```shell
./agent_scripts/serve_docs_github.sh [port]
```

Or manually:

```shell
uv run python docs/build_site.py
ln -sfn docs particleviz
python -m http.server 4000
```

Open http://localhost:4000/particleviz/

## Publishing

- Source: markdown in `docs/*.md`, layouts in `docs/_layouts/`, nav in `docs/_data/navigation.yml`
- Builder: `docs/build_site.py` writes HTML into `docs/` (same folder as sources)
- CI: `.github/workflows/docs.yml` runs `uv run python docs/build_site.py` on push to `main`/`master` when `docs/**` changes
- Live site: https://olmozavala.github.io/particleviz/
- GitHub Pages source should be **GitHub Actions** (not "deploy from branch")

After editing any `docs/*.md`, rebuild before commit:

```shell
uv run python docs/build_site.py
```

Production build uses `baseurl /particleviz/` (default, no `--local` flag).

## Related files

| File | Role |
|------|------|
| `docs/build_site.py` | Jinja2 + markdown site builder |
| `agent_scripts/serve_docs.sh` | Local preview with `--local` |
| `agent_scripts/serve_docs_github.sh` | Local preview with production URLs |
| `agent_scripts/run_all_configs.py` | Run all ConfigExamples on separate ports |
| `agent_scripts/capture_example_gifs.py` | Regenerate example GIFs for the docs site |
| `.github/workflows/docs.yml` | GitHub Pages deploy |
| `docs/deployment.md` | Brief public note on docs deployment (keep in sync if workflow changes) |
