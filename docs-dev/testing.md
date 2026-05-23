# Testing

This repository uses **[Jest 30](https://jestjs.io/)** with the JSDOM
environment for browser-style code. The full suite runs in roughly
15–20 seconds on a laptop.

```bash
npm test                # full suite
npm run test:coverage   # with coverage report
npx jest tests/foo.test # single file (no extension needed)
```

## Layout

```
__tests__/        Snapshot- and dashboard-heavy tests (Jest's default folder)
tests/            Everything else
  helpers/
    load-app.js   Loads docs/app.js into a JSDOM document
```

Both folders are scanned automatically thanks to `jest.config.js`.
There is no naming convention beyond `*.test.js` — pick the folder
that matches the tone of the test.

## Writing a new test

A typical test for a module under `docs/modules/`:

```js
const { loadApp } = require('./helpers/load-app');

describe('compare.js', () => {
  let win;

  beforeEach(() => {
    win = loadApp();          // fresh JSDOM + every module loaded
  });

  test('adds a project to the compare tray', () => {
    win.Compare.add('winsentinel');
    expect(win.Compare.list()).toContain('winsentinel');
  });
});
```

`loadApp()` is a heavy operation (it parses every module). If you only
need pure logic, prefer requiring the function directly:

```js
const { _capDeepLink, _MAX_DEEPLINK_LEN } = require('../docs/modules/deep-link');
```

(Underscore-prefixed exports are explicitly test-only — see
[architecture.md](architecture.md#-testability-seams).)

## Coverage targets

There is no hard coverage threshold gating CI today, but the de facto
floor is:

| Surface | Floor |
|---|---|
| `docs/modules/*.js` | 85% statements |
| `docs/shared/rheology.js` (pure) | 95% statements |
| `scripts/refresh-sitemap.js` | 100% statements |

If a PR drops coverage on any module below its current value by more
than 2 percentage points, push back in review.

## Debugging tips

- `npx jest --runInBand path/to/test.js` runs serially so you can read
  `console.log` output in order.
- Add `it.only(...)` or `describe.only(...)` to isolate a flake.
- Pass `DEBUG_LOAD_APP=1` to `loadApp()` to dump the JSDOM HTML after
  module wiring.

## Pre-existing flakes

- The full suite ends with a Jest warning:
  *"A worker process has failed to exit gracefully."* This is harmless
  — a JSDOM timer in one of the dashboard tests holds the event loop
  open. The tests themselves pass. Tracked in
  [#future-cleanup](https://github.com/sauravbhattacharya001/sauravbhattacharya001/issues).

## When a test fails on `master`

CI runs the suite on every push to `master`. If `test.yml` goes red:

1. **Don't push a "fix" commit speculatively.** Reproduce locally.
2. If the failure is in *your* change, fix it.
3. If the failure looks pre-existing, check `git log -p <test-file>`
   for recent edits.
4. Open an issue with the `tests` and `bug` labels.
