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

2. Copy your *build* folder into your web server. For example, if you have an [Apache](https://httpd.apache.org/)
web server at `/var/www/html` you could copy your project to `/var/www/html/myawesomemodel`.

### Production Deployment Methods

Once the `build/` folder is generated, there are two common ways to transfer it to your production server:

#### Method A: Using `rsync` (Command Line)
If you have SSH access to your web server, `rsync` is the fastest and most efficient way to upload changes. From the root of the `particleviz` repository, run:

```shell
rsync -avz --delete ParticleViz_WebApp/build/ username@yourserver.edu:/var/www/html/myawesomemodel/
```

*Note: The trailing slash on `build/` ensures that only the contents of the folder are copied, not the folder itself.*

#### Method B: Using SFTP (GUI Clients)
If you prefer a graphical interface:
1. Connect to your server via an SFTP client (like FileZilla or Cyberduck) using your credentials.
2. Navigate to your target web directory (e.g., `/var/www/html/myawesomemodel/`).
3. Drag and drop the **contents** of the local `ParticleViz_WebApp/build/` folder into the remote directory.

### Host Subfolder Configuration
By default, the React app's `package.json` has `"homepage": "."` set, which means all resource links in the generated `index.html` are relative. This allows you to host the files in any subfolder on your web server without having to change any settings or rebuild the application.

