# Portfolio Frontend Architecture

This directory contains the modular frontend that powers the portfolio site
(`docs/index.html`). The codebase deliberately uses **classic browser scripts**
(no bundler, no module system) so the site loads instantly from GitHub Pages
with zero build step. Each module is loaded via a `<script>` tag in
`index.html` and contributes functions / state to the shared global scope.

## Why no bundler?

- **Zero build, zero CI surprises.** What you see in `docs/` is what GitHub
  Pages serves. No webpack config to debug.
- **Stable SRI hashes.** Each file has a stable hash referenced by the
  `integrity=` attribute in `index.html` — see [`SECURITY.md`](../../SECURITY.md).
  A bundler would invalidate this on every build.
- **JSDOM-friendly tests.** Jest tests in `tests/` `eval()` these scripts
  inside a JSDOM context (see `tests/helpers/`). No transpilation step
  means tests run against the exact code the browser executes.

## Load order

Scripts in `docs/index.html` are loaded in dependency order. Foundational
modules first (no deps, pure helpers), then data, then renderers, then
controllers, with `app.js` last to wire everything up on
`DOMContentLoaded`.

If you add a new module, place its `<script>` tag **after** anything it
depends on and **before** anything that depends on it.

## Module reference

Each module attaches its functions to the global scope. Listed below are
the actual top-level functions defined in each file (grep for the name to
find the implementation).

### `modules/html-helpers.js`
XSS-safe HTML escaping and URL sanitisation. Pure functions, no DOM
writes, safe to call from tests.
- `escapeHTML(str)` — escapes `& < > " '` via a single compiled regex.
- `sanitizeURL(url)` — rejects `javascript:` / `data:` schemes.

### `modules/theme.js`
Dark/light theme: reads system preference, persists choice in
`localStorage`, applies a `data-theme` attribute on `<html>`.
- `getPreferredTheme()`, `applyTheme(theme)`, `toggleTheme()`, `initTheme()`

### `modules/projects.js`
The single source of truth: the `PROJECTS[]` catalog with
`{repo, title, desc, tags, icon, ...}` objects. **All other modules read
from this.** Adding a new project = adding an entry here.

### `modules/search-index.js`
Pre-computes a flat lowercase string + tag set per project at load time so
filtering is O(N) per keystroke instead of repeated O(N·T)
`.toLowerCase()` calls. Exposes `_searchIndex` for `render.js`'s
`projectMatchesQuery`.

### `modules/bookmarks.js`
Per-user starred projects, persisted in `localStorage`. Triggers a
"bookmarks filter" pill in the UI.
- `isBookmarked(repo)`, `toggleBookmark(repo)`, `getBookmarkCount()`,
  `setBookmarkFilter(active)`, `initBookmarks()`

### `modules/render.js`
Builds project card HTML, tag chips, link lists, and the full grid.
Always goes through `escapeHTML` — never builds HTML by concatenating
untrusted strings.
- `buildCard(p, opts)`, `buildCardHeader(p)`, `buildCardTags(tags)`,
  `buildCardLinks(links)`, `buildTagList(tags, opts)`,
  `buildLinkList(links, opts)`
- `projectMatchesQuery(p, query, idx)`, `filterProjects()`

### `modules/modal.js`
Project-detail modal with focus trap and Esc-to-close.
- Internal helpers: `_activateModal`, `_deactivateModal`, `_handleModalTab`
  (the modal is opened/closed by event delegation in `app.js`).

### `modules/compare.js`
Side-by-side comparison of multiple selected projects: matrix of features,
languages, infrastructure. Uses an IIFE module pattern with internal
`toggle / clear / syncUI / renderPanel / close` helpers.

### `modules/quiz.js`
"Which project should I look at?" recommendation quiz. Scores each
project against the user's answers.
- `startQuiz()`, `answerQuiz(questionIdx, optionIdx)`, `renderQuizStep()`,
  `renderQuizResults()`, `resetQuiz()`, `toggleQuiz()`, `initQuiz()`

### `modules/spotlight.js`
Rotating featured-project hero block at the top of the page. IIFE module
with `render / next / prev / goTo / togglePause / startTimer / stopTimer`.

### `modules/timeline.js`
Year-by-year timeline visualisation. IIFE module that parses release
dates, computes the time range, positions markers, and renders.

### `modules/tech-radar.js`
Tech radar chart showing language and framework adoption across the
portfolio. IIFE module with `computeStack / groupByType / buildPanel /
render / toggle / setFilter / wireEvents / init`.

### `modules/sort-view.js`
Sort dropdown and view-mode (grid/list) controls. Defines a registry of
named sort comparators.
- `sortProjects(projects, sortKey)`, `setSortOrder(sortKey)`,
  `_isKnownSortKey(key)`

### `modules/keyboard.js`
Global keyboard shortcuts: `/` to focus search, `j/k` to move card focus,
`?` to open the shortcut help overlay.
- `getVisibleCards()`, `focusCard(index)`, `blurCards()`,
  `openFocusedCard()`, `showKeyboardHelp()`, `hideKeyboardHelp()`,
  `toggleKeyboardHelp()`, `buildHelpOverlay()`

### `modules/deep-link.js`
Reads filter state from the URL hash on load and writes it back when
filters change, so a filtered view is shareable. **Hardened against
prototype pollution & DoS** — see commit `db3aec3`; `_capDeepLink`
truncates pathological inputs.
- `serializeFilterState()`, `deserializeFilterState(hash)`,
  `pushFilterState()`, `initDeepLink()`

### `modules/analytics.js`
Lightweight, privacy-preserving analytics computed entirely from the
local `PROJECTS[]` catalog — no third-party calls, no PII.
- `computeCategoryDistribution(projects)`,
  `computeTagDistribution(projects)`,
  `computePortfolioSummary(projects)`,
  `buildBarChart(data, maxBars)`, `buildTagCloud(tags, maxTags)`,
  `buildAnalyticsPanel(projects)`, `toggleAnalytics()`

### `modules/tag-clicks.js`
A single delegated click listener that turns tag chips into filters.
Tiny on purpose.
- `wireTagClicks()`

## `shared/`

| File | Purpose |
|---|---|
| `rheology.js` | Pure math: shear-rate / viscosity calculations for the rheology / 3D-printability page. **No DOM access** — safe to unit-test directly. |
| `rheology-ui.js` | DOM and chart code for `rheology.html`. Depends on `rheology.js`. |
| `rheology.css` | Styles for `rheology.html` only. |

## Conventions

- **No `import` / `export`.** These are classic scripts; everything lives
  on the global scope. Prefix internal helpers with `_` (e.g. `_escapeRe`,
  `_persistBookmarks`) so the public surface is obvious.
- **Never `innerHTML` user data.** Always go through `escapeHTML` /
  `sanitizeURL`. The `db3aec3` security commit exists because of a
  near-miss on the deep-link path.
- **No build tools added casually.** A bundler/transpiler would invalidate
  the SRI hashes pipeline, break the JSDOM test harness, and break local
  development ergonomics. If you truly need one, open an issue first.
- **Tests live in `tests/` and `__tests__/`.** Run `npm test` (Jest +
  JSDOM). `npm run test:coverage` for coverage. The 80% threshold is
  enforced in `jest.config.js`.
- **One module = one concern.** If a module starts mixing data, UI, and
  persistence, split it.

## Adding a new module

1. Create the file under `docs/modules/`.
2. Add a `<script src="modules/your-module.js">` tag to `docs/index.html`
   in the correct load-order slot.
3. Add a test in `tests/your-module.test.js` that loads the script via
   the JSDOM helper in `tests/helpers/`.
4. Update SRI hashes for any file referenced from `index.html` — see
   `SECURITY.md` § Subresource Integrity for the one-liner.

## Related

- [`SECURITY.md`](../../SECURITY.md) — SRI hashes, vulnerability reporting.
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — full contributor guide.
- [`../../.github/copilot-instructions.md`](../../.github/copilot-instructions.md) — context for AI coding agents.
