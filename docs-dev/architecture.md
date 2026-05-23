# Architecture

This repository serves two related but independent surfaces from a single
static `docs/` tree:

1. **The portfolio site** — `docs/index.html` plus `docs/app.js` and the
   modules under `docs/modules/`.
2. **The rheology playground** — `docs/rheology.html` plus everything
   under `docs/shared/`.

Both are served by GitHub Pages from the `master` branch's `/docs`
directory (see [deploy.md](deploy.md)).

## 🧱 Design rationale: no bundler

The frontend deliberately avoids a bundler, a module system, and a
package manager at runtime. That decision was not nostalgic — it solves
three real problems:

- **First paint is measured in tens of milliseconds.** GitHub Pages
  serves the raw assets over HTTP/2; there is no JS parse waterfall
  hidden inside a megabyte of vendor code.
- **Subresource Integrity (SRI) is trivial to enforce.** Every
  `<script>` and `<link>` in `docs/index.html` carries a `sha384-…`
  hash. The deploy workflow [verifies the hashes match the actual file
  bytes](deploy.md#sri-verification) and refuses to publish if they
  drift. A bundler-generated hash-in-filename approach would make this
  check far noisier.
- **Tests can load the whole app inside JSDOM without polyfills.** See
  `tests/helpers/load-app.js` — it reads `docs/app.js` as text,
  evaluates it inside a `Document`-shaped environment, and the same
  bytes that run in the browser run under Jest. No transpilation, no
  source-map skew, no "works in dev, breaks in prod" gap.

## 🗺️ Module map

```
docs/
├── index.html              Portfolio shell (renders #app placeholder)
├── app.js                  Bootstrap: feature detect → wire modules
├── style.css               Global styles + design tokens
├── modules/
│   ├── analytics.js        Lightweight, opt-in event reporting
│   ├── bookmarks.js        Saved-projects state (localStorage)
│   ├── compare.js          Side-by-side project comparison UI
│   ├── deep-link.js        Hash-based filter state (capped length)
│   ├── html-helpers.js     Safe HTML construction primitives
│   ├── keyboard.js         Global keyboard shortcuts (?, /, esc)
│   ├── modal.js            Accessible modal dialog primitive
│   ├── projects.js         Project data + filter/sort logic
│   ├── quiz.js             Embedded knowledge-check widget
│   ├── render.js           Project card / list renderers
│   ├── search-index.js     In-memory inverted index for search
│   ├── sort-view.js        Sort selector + active-pill highlighting
│   ├── spotlight.js        Daily "spotlight" rotation
│   ├── tag-clicks.js       Tag chip interaction handlers
│   ├── tech-radar.js       Technology radar chart
│   ├── theme.js            Light/dark theme toggling + persistence
│   └── timeline.js         Career timeline rendering
├── rheology.html           Standalone rheology playground page
└── shared/
    ├── rheology.css
    ├── rheology.js         Pure simulation (no DOM)
    └── rheology-ui.js      DOM glue around rheology.js
```

Each module exports its public surface by attaching a single namespace
to `window` (e.g. `window.Compare = { … }`). Modules consume each
other through those namespaces — never through global free functions.
This makes the dependency graph easy to grep and easy to mock.

## 🔄 Data flow (portfolio)

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  PROJECTS.md    │ →  │  projects.js     │ →  │  render.js      │
│  (source of     │    │  (parses front-  │    │  (DOM emission) │
│   truth)        │    │   matter, sorts) │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ search-index.js  │
                       │ (inverted index) │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ deep-link.js     │
                       │ (URL ↔ state)    │
                       └──────────────────┘
```

`PROJECTS.md` is the **single source of truth** for the project catalog.
It is parsed at runtime by `projects.js` (no build step). The same file
is also human-readable on GitHub, which is the point.

## 🧪 Testability seams

- DOM helpers funnel through `html-helpers.js`, which uses
  `Element.textContent` instead of `innerHTML` wherever possible —
  every test asserting "no XSS" reduces to a `textContent` assertion.
- `deep-link.js` exports `_capDeepLink`, `_MAX_DEEPLINK_LEN`, and
  `_MAX_DEEPLINK_PAIRS` for tests. The underscore prefix marks them as
  "test-only, not public API."
- `rheology.js` is pure — it returns numbers given numbers — and lives
  apart from `rheology-ui.js` for exactly that reason.

## 🚫 Non-goals

- **No SPA router.** The site has two real pages and a hash for filter
  state. That's it.
- **No SSR.** The site is static, by design.
- **No CSS-in-JS.** All styles live in `docs/style.css` or
  `docs/shared/rheology.css`. Specificity is managed by convention,
  not by tooling.

See [development.md](development.md) for how to add features without
violating these constraints.
