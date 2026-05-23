# Local Development

## Prerequisites

- **Node.js 20+** (the CI matrix tests on 20 and 22)
- **npm 10+** (comes with Node 20)
- Optional: Python 3.11+ if you want to serve the static site with
  `python -m http.server` instead of the `npx` recipe below.

No globally installed CLIs are required.

## First-time setup

```bash
git clone https://github.com/sauravbhattacharya001/sauravbhattacharya001.git
cd sauravbhattacharya001
npm install
```

`npm install` only pulls **dev dependencies** (Jest and JSDOM). The
runtime site has zero npm dependencies.

## Running the site locally

Pick whichever one-liner you prefer — they're equivalent:

```bash
# Node — no install needed
npx --yes http-server docs -p 8080 -c-1

# Python 3
python -m http.server -d docs 8080
```

Then open <http://localhost:8080>. The rheology playground is at
<http://localhost:8080/rheology.html>.

> ⚠️ Hard-refresh after editing `app.js` or `style.css` because the
> deployed `index.html` pins SRI hashes. The local server doesn't
> enforce them, but if you forget you'll be staring at stale bytes.

## Refreshing the sitemap

The sitemap (`docs/sitemap.xml`) is generated from `scripts/refresh-sitemap.js`.
Run it whenever you add or rename a page in `docs/`:

```bash
node scripts/refresh-sitemap.js
```

CI does not run this automatically — it's a developer responsibility.

## Updating SRI hashes after editing `app.js` or `style.css`

The deploy workflow rejects pushes where the SRI hash in
`docs/index.html` doesn't match the on-disk bytes of `app.js` or
`style.css`. To regenerate:

```bash
cd docs
for f in app.js style.css; do
  echo "$f: sha384-$(openssl dgst -sha384 -binary "$f" | base64 -w0)"
done
```

Paste the resulting hashes into `docs/index.html` next to each
`<script>` / `<link>`.

## MkDocs preview (optional)

These developer docs are plain Markdown, so any renderer works. If you
want a polished local preview:

```bash
pip install --user mkdocs-material
mkdocs serve -f docs-dev/mkdocs.yml
```

> ℹ️ `docs-dev/mkdocs.yml` is provided for convenience but is not built
> by CI and is not part of the published site. The canonical view of
> these docs is GitHub's Markdown rendering.

## Common pitfalls

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm test` hangs at the end | A JSDOM timer wasn't unrefed | Look for `setInterval` without `.unref()` in tests/helpers |
| Pages deploy fails with "SRI mismatch" | You edited `app.js` but not `index.html` | Regenerate hashes (see above) |
| Lighthouse CI flags "no robots.txt" | You added a new top-level page but didn't add it to the sitemap | Run `node scripts/refresh-sitemap.js` |
| `tests/labeler-config.test.js` fails after editing `.github/labeler.yml` | You added a new label name | Update the `ALLOWED_LABELS` set *and* run `gh label create` |

See [testing.md](testing.md) for how to debug failing tests.
