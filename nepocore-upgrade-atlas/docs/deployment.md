# Deploy Upgrade Atlas

Extract `nepocore-upgrade-atlas.zip` and open the extracted `nepocore-upgrade-atlas` directory. Keep the contents of this directory at the GitHub repository root, including `.github/workflows/pages.yml` and `.node-version`.

## Push to GitHub once

Create an empty GitHub repository. A public repository can use GitHub Free for Pages. From the extracted directory, run these commands after substituting the HTTPS repository URL from GitHub.

```sh
git init -b main
git add .
git commit -m "Add NepoCore Upgrade Atlas"
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

If the repository is already initialized locally, copy these files into its root, commit them, and push using its existing remote.

## Option 1 · Host on GitHub Pages

1. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
2. Open **Actions → Deploy Upgrade Atlas to GitHub Pages → Run workflow** and select `main`. This also covers the first push if it arrived before Pages was enabled.
3. Open the deployment URL shown by the workflow or Pages settings. Subsequent pushes to `main` rebuild and publish automatically.

The workflow tests the site, builds `dist/` and publishes only that directory. Pages passes the repository base path to the build so nested 404 pages can link back to the correct project. Normal model and guide links work from either a root domain or a repository subpath. [GitHub Pages workflow documentation](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically)

## Option 2 · Host on Cloudflare Pages with GitHub integration

In Cloudflare, open **Workers & Pages**, create a **Pages** application and import the GitHub repository. Use these settings.

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | None |
| Root directory | Repository root, leave blank |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js | Uses Node 22 from `.node-version` |

Deploy and open the assigned `pages.dev` URL. Pushes to `main` update it. Cloudflare applies the security settings from the built `_headers` file. Use a Git-integrated Pages project for this flow. [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/) · [Node version settings](https://developers.cloudflare.com/pages/configuration/build-image/)

## Attach a custom subdomain

- **Cloudflare Pages hosting.** Add your subdomain under the Pages project’s **Custom domains** first. For a zone Cloudflare manages, review and confirm the offered DNS record. For external DNS, add the CNAME Cloudflare provides, targeting your assigned `pages.dev` hostname. [Cloudflare custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- **GitHub Pages hosting with Cloudflare DNS.** Add your subdomain in the repository’s Pages settings. At Cloudflare DNS, add a DNS-only CNAME targeting the account’s `github.io` hostname without a repository path. After GitHub validates DNS and provisions HTTPS, select **Enforce HTTPS**. [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

If you enable both hosts, choose which one serves the custom subdomain. Once that URL works, set `siteUrl` in `config.json` to the preferred public URL and commit the change to generate the canonical tags and sitemap. Keep the default `null` until you have a real URL. No production domain or account credentials are embedded in the project.

## Check the live result

Open the homepage, a model, a guide and the comparison page. Search for `20KE`, copy a model URL, and open a nonexistent nested route to confirm the 404 page can return to the catalogue. If you set `siteUrl`, check `sitemap.xml` on the preferred host.
