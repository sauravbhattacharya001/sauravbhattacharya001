# Glossary

Project-specific terms that show up in the code, tests, and other
docs. If something here surprises you, file an issue or a doc PR.

### Deep link

A URL fragment (`#…`) that encodes the current filter / sort / search
state of the portfolio so it can be shared. See `docs/modules/deep-link.js`.

### Deep-link cap

The hard upper bound on deep-link length (`_MAX_DEEPLINK_LEN`) and on
the number of `key=value` pairs (`_MAX_DEEPLINK_PAIRS`). Defends
against pathological hashes (e.g. someone pasting a 4 MB string).
Both constants live in `docs/modules/deep-link.js`.

### JSDOM

The headless DOM implementation Jest uses as its default test
environment. The `tests/helpers/load-app.js` helper wires it up so
the whole site can be required from a Node test.

### Module (this repo)

A single `*.js` file under `docs/modules/` or `docs/shared/` that
attaches one namespace to `window` (or `globalThis` for the pure
rheology module). Distinct from "ES module" — these are classic
browser scripts loaded via `<script>` tags.

### Portfolio site

The publicly deployed page at <https://www.sauravbhattacharya.com>.
Source lives in `docs/`.

### PROJECTS.md schema

The Markdown front-matter convention used by `docs/modules/projects.js`
to parse each project entry. Documented inside `PROJECTS.md` itself.

### Rheology playground

The interactive viscosity / shear-rate calculator at
`docs/rheology.html`. Pure simulation lives in `docs/shared/rheology.js`;
DOM glue in `docs/shared/rheology-ui.js`.

### SRI (Subresource Integrity)

A `sha384-…` hash on a `<script>` or `<link>` tag that tells the
browser to refuse the asset if its bytes don't hash to the expected
value. Used here to guarantee that the deployed bytes match the
bytes the developer signed off on. See [security.md](security.md#subresource-integrity).

### `_capDeepLink`

Test-only export from `deep-link.js`. Truncates a string to
`_MAX_DEEPLINK_LEN`. Underscore prefix marks it as **not** public
API.

### `loadApp()`

Helper in `tests/helpers/load-app.js` that returns a JSDOM window
with every portfolio module loaded and wired up. Use sparingly — it's
the most expensive thing in the test suite.

### `setActivePill`

Render helper that toggles the `aria-current="page"` attribute on
the sort selector pills. Lives in `docs/modules/render.js`. Has its
own test file (`tests/set-active-pill.test.js`) because it's
load-bearing for accessibility.
