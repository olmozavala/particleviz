---
layout: default
title: Deployment
---

## Documentation site (GitHub Pages)

The docs at [olmozavala.github.io/particleviz](https://olmozavala.github.io/particleviz/) are built with `docs/build_site.py` and served as static HTML from the `docs/` folder (`.nojekyll` disables Jekyll).

After editing markdown under `docs/`, rebuild and commit the generated HTML:

```shell
uv run python docs/build_site.py
```

Optional: enable **Settings → Pages → Build and deployment → GitHub Actions** so `.github/workflows/docs.yml` deploys on push without committing HTML.

## Server Deployment

If you want to share your visualization with the world, you will need to deploy your site on
a computer with a public ip address or in an existing web server. The proper way to do it is
to build an optimized version ready for production and add it into an existing web server.

Here are the most common steps to do this:

1. Build your optimized build with `npm`. Inside the `ParticleViz_WebApp` folder, use the following command
to generate this build (inside a `build` folder).

```shell
cd ParticleViz_WebApp
npm run-script build
```

2. Copy your *build* folder into you web server. For example, if you have an [Apache](https://httpd.apache.org/)
web server at `/var/www/html` you could copy your project to `/var/www/html/myawesomemodel`. If you don't
know what I'm talking about ask your IT guy to help you.
