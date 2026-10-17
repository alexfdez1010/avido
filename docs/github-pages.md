# Marketing website

The independent static website in `site/` is published at
[alexfdez1010.github.io/avido](https://alexfdez1010.github.io/avido/).
It requires no app build, package installation, or client-side framework. The
dependency-free `scripts/build-site.cjs` generator produces its localized HTML.

## Routes and language

- `/avido/` chooses Spanish or English from the browser's preferred languages,
  with English as the fallback. Visible language links also work without JavaScript.
- `/avido/es/` and `/avido/en/` are stable, fully rendered Spanish and English pages.
- The language switch links directly to the other language, so a shared localized
  URL keeps its language instead of redirecting the visitor again.

The two localized pages have their own title, description, canonical URL, Open
Graph metadata, and 1200 × 630 PNG sharing image. Reciprocal `hreflang` links,
an `x-default` entry, structured data, and `sitemap.xml` help crawlers discover both
versions. Content is readable before JavaScript runs. Metadata helps discovery
and sharing; it does not guarantee search rankings or immediate indexing.

## Preview and checks

After editing the generator or its inputs, regenerate the localized pages before
previewing or running the website checks:

```sh
node scripts/build-site.cjs
```

Serve only the public website directory with a local static server. For example:

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory site
```

Open `http://localhost:8080/`. Use the explicit `/es/` and `/en/`
URLs to review both languages. Canonical and sharing URLs deliberately point to
the production website during a local preview.

Run the focused, dependency-free website checks:

```sh
node --test scripts/test-site.cjs
```

They check the localized SEO metadata, social image dimensions, structured data,
language links, sitemap, and local link and asset targets. `npm test` includes these
checks alongside the application tests. When editing the site, also inspect desktop
and mobile layouts in a browser.

## Deployment

In the repository's **Settings → Pages → Build and deployment**, select **GitHub
Actions** as the source. GitHub Pages availability for private repositories depends
on the account plan; a public repository can use Pages with GitHub Free.

`.github/workflows/pages.yml` regenerates the pages and validates changes on pull
requests, then publishes
`site/` after relevant pushes to `main`. It can also be run manually from the
**Actions → Publish website** page. Only the deployment job receives `pages: write`
and `id-token: write`; no personal access token or custom deployment secret is
needed. The `github-pages` environment can apply repository protection rules.

The APK release workflow remains independent. Publishing this website does not
replace or build the Android download.

If the owner, repository name, or domain changes, update canonical and alternate
URLs, social image URLs, structured data, `robots.txt`, `sitemap.xml`, this guide,
and the expected production URL in `scripts/test-site.cjs` together.

See [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
for the deployment and permission requirements.

See [website assets](website-assets.md) for screenshot provenance and font licenses.
