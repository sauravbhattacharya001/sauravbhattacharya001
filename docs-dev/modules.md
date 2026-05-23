# Module Reference

> Quick API surface for everything in `docs/modules/`. For deeper
> architecture, see [architecture.md](architecture.md). The
> long-form per-module README lives at
> [../docs/modules/README.md](../docs/modules/README.md) — this page
> is the lookup table.

Every module attaches a single namespace to `window`. Methods marked
`_internal` are test-only and may break without notice.

## analytics.js — `window.Analytics`

| Method | Signature | Purpose |
|---|---|---|
| `track` | `(event, props?)` | Send an opt-in event. No-op if user opted out. |
| `optOut` | `()` | Set the localStorage opt-out flag and clear queued events. |

## bookmarks.js — `window.Bookmarks`

| Method | Signature | Purpose |
|---|---|---|
| `add` | `(projectId)` | Persist a project to the bookmarks set. |
| `remove` | `(projectId)` | Remove a project. |
| `has` | `(projectId) → boolean` | Check membership. |
| `list` | `() → string[]` | Stable-sorted list. |

## compare.js — `window.Compare`

| Method | Signature | Purpose |
|---|---|---|
| `add` | `(projectId)` | Add to compare tray (max 3). |
| `remove` | `(projectId)` | Remove from tray. |
| `clear` | `()` | Empty the tray. |
| `list` | `() → string[]` | Current tray contents. |

## deep-link.js — `window.DeepLink`

| Method | Signature | Purpose |
|---|---|---|
| `serialize` | `(state) → string` | Encode filter state into a hash-safe string. |
| `deserialize` | `(hash) → state` | Reverse of `serialize`, with length & pair caps applied. |
| `_capDeepLink` | `(s) → s` | Test-only truncator. |
| `_MAX_DEEPLINK_LEN` | constant | Hard length cap (defends against pathological hashes). |
| `_MAX_DEEPLINK_PAIRS` | constant | Hard pair-count cap. |

## html-helpers.js — `window.HtmlHelpers`

| Method | Signature | Purpose |
|---|---|---|
| `el` | `(tag, attrs?, children?)` | Create an Element with sanitised attributes. |
| `text` | `(s)` | Create a TextNode (always XSS-safe). |
| `clear` | `(node)` | Remove all children of a node. |

## keyboard.js — `window.Keyboard`

Wires global shortcuts: `/` focuses search, `?` opens help modal,
`Esc` closes the topmost overlay. No public API beyond `init()`.

## modal.js — `window.Modal`

| Method | Signature | Purpose |
|---|---|---|
| `open` | `(content, opts?)` | Open an accessible modal (focus trap, ARIA wiring). |
| `close` | `()` | Close the topmost modal. |

## projects.js — `window.Projects`

| Method | Signature | Purpose |
|---|---|---|
| `all` | `() → Project[]` | Parsed `PROJECTS.md` entries. |
| `filter` | `(predicate) → Project[]` | Pure filter. |
| `sort` | `(key, dir?) → Project[]` | Sort by `name | year | stars | releases`. |

## quiz.js — `window.Quiz`

Embedded knowledge-check widget. Driven by the `data-quiz` attribute
on its host element. No public API beyond `mount(rootEl)`.

## render.js — `window.Render`

| Method | Signature | Purpose |
|---|---|---|
| `cards` | `(projects, mountEl)` | Render card grid. |
| `list` | `(projects, mountEl)` | Render list view. |
| `setActivePill` | `(name)` | Highlight the active sort pill. |

## search-index.js — `window.SearchIndex`

| Method | Signature | Purpose |
|---|---|---|
| `build` | `(projects)` | (Re)build the inverted index. |
| `score` | `(query) → SearchHit[]` | TF-IDF-ish ranking, capped at top 50. |

## sort-view.js — `window.SortView`

Sort selector. Calls `Render.setActivePill` on change. No public API
beyond `init(mountEl)`.

## spotlight.js — `window.Spotlight`

| Method | Signature | Purpose |
|---|---|---|
| `pick` | `(projects, dateLike?)` | Deterministic "spotlight" choice for a given day. |

## tag-clicks.js — `window.TagClicks`

Tag chip click handler. No public API beyond `init(rootEl)`.

## tech-radar.js — `window.TechRadar`

| Method | Signature | Purpose |
|---|---|---|
| `render` | `(skills, mountEl)` | Draw the SVG radar chart. |

## theme.js — `window.Theme`

| Method | Signature | Purpose |
|---|---|---|
| `current` | `() → 'light' | 'dark'` | Resolved theme (respects `prefers-color-scheme`). |
| `toggle` | `()` | Flip and persist. |
| `set` | `(theme)` | Explicit set. |

## timeline.js — `window.Timeline`

| Method | Signature | Purpose |
|---|---|---|
| `render` | `(entries, mountEl)` | Draw the career timeline. |

## `docs/shared/rheology.js` — pure simulation

This is the only module that does not attach to `window`. It exports a
classic CommonJS-style surface in Node (for testing) and assigns to
`globalThis.Rheology` in the browser. See `tests/rheology-printability.test.js`
for the canonical usage pattern.
