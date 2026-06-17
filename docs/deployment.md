---
layout: default
title: Deployment
---

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
