# NepoCore Upgrade Atlas

An independent, static laptop reference for RAM, storage and configuration caveats. The first catalogue covers six documented Lenovo ThinkPad platforms: T480, T490, X280, T14 Gen 1 (Intel), T14 Gen 2 (Intel) and E14 Gen 2 (Intel).

## Preview and build

Requires Node.js 22 or later to build. There is no dependency install.

```sh
npm run build
npm test
python3 -m http.server 8765 --directory dist
```

Open [the local preview](http://localhost:8765). Serve the files over HTTP for the interactive features. Each model’s specifications remain readable without JavaScript. The experimental `file://` origin blocks module loading in many browsers.

## Deploy from GitHub

- **GitHub Pages** runs the included workflow. Choose **Settings → Pages → Source → GitHub Actions** and run **Deploy Upgrade Atlas to GitHub Pages**.
- **Cloudflare Pages** can build the same repository. Choose **Import an existing Git repository**, select branch `main`, set the build command to `npm run build` and output directory to `dist`.
- For a manual static deployment, upload the included `dist/` directory as the site output.

See the [deployment guide](docs/deployment.md) for the Git commands, provider settings, and custom-subdomain steps. Set `siteUrl` to your real public URL to generate canonical URLs and a sitemap. Set `correctionEmail` to a monitored address to generate the corrections page. Rebuild after editing `config.json`.

## Editing and quality checks

- `data/catalogue.json` holds the claims and source references. See [schema and worked example](docs/catalogue-schema.md).
- `data/guides.json` holds the guide text and primary references.
- `assets/` contains the browser JavaScript, stylesheet and original SVGs.
- `scripts/build.mjs` generates static pages, assets and optional sitemap.
- [Source register](docs/source-register.md), [verification report](docs/verification.md) and [dependency and licence information](docs/dependencies.md).

For optional browser QA, install Python Playwright and use its Chromium install or set `ATLAS_CHROMIUM` to a compatible installed Chromium executable. Serve the root of `dist/` at port 8765 in another terminal and run `python3 scripts/browser-check.py`. Set `ATLAS_TEST_URL` to change the base URL.

## Future advertising

The homepage includes an inert `advertising-slot` template. To enable advertising, obtain a real approved publisher and placement ID, then instantiate the template in a section outside the model specifications and label the rendered block “Advertisement”. Add only the required provider origins to the relevant security directives. Before enabling any provider script, revise Privacy to describe its data collection and retention and implement any consent controls required for your deployment. Keep sponsored content visibly separate from the catalogue and its evidence.
