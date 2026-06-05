# Contributing to sauravbhattacharya001

Thanks for your interest in improving this GitHub profile and portfolio site. This project serves two purposes:

1. **GitHub Profile README** (`README.md`) — the public-facing profile rendered on [github.com/sauravbhattacharya001](https://github.com/sauravbhattacharya001)
2. **Portfolio Web App** (`docs/`) — an interactive project showcase deployed via GitHub Pages

Both need love. Here's how to contribute effectively.

---

## Table of Contents

- [What You Can Help With](#what-you-can-help-with)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Markdown Linting](#markdown-linting)
- [Portfolio App Guidelines](#portfolio-app-guidelines)
- [Docker Development](#docker-development)
- [Reporting Issues](#reporting-issues)
- [Code of Conduct](#code-of-conduct)

---

## What You Can Help With

### Profile README

- **Content improvements** — Clearer wording, better project descriptions, updated stats
- **Design upgrades** — Badges, layout, visual hierarchy, dark/light theme compatibility
- **Link maintenance** — Fixing broken URLs, updating outdated references
- **New sections** — Skills, certifications, talks, publications

### Portfolio Web App

- **Features** — New interactive elements, project cards, filtering improvements
- **Performance** — Load time, animation smoothness, bundle size
- **Accessibility** — Screen reader support, keyboard navigation, contrast
- **Responsive design** — Mobile/tablet layout, touch interactions
- **Bug fixes** — Rendering issues, broken interactions, state management

### Infrastructure

- **CI/CD** — Workflow improvements, caching, faster builds
- **Testing** — New test cases, coverage improvements, flaky test fixes
- **Security** — CSP headers, dependency vulnerabilities, Docker hardening
- **Documentation** — Architecture docs, inline comments, API documentation

---

## Development Setup

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **Git** ≥ 2.30
- A modern browser (Chrome, Firefox, Safari, or Edge)
- (Optional) **Docker** for containerized testing

### Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/sauravbhattacharya001.git
cd sauravbhattacharya001

# 2. Install dev dependencies
npm install

# 3. Run the test suite
npm test

# 4. Preview the portfolio locally
# Open docs/index.html in your browser, or:
npx serve docs
```

### Editor Setup

Recommended VS Code extensions:
- [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) — enforces `.markdownlint.json` rules
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) — consistent formatting
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) — hot-reload for `docs/`

---

## Project Structure

```
├── README.md               # GitHub profile content (rendered at github.com/sauravbhattacharya001)
├── PROJECTS.md             # Detailed project catalogue (linked from README)
├── CONTRIBUTING.md         # ← You are here
├── SECURITY.md             # Security policy and vulnerability reporting
├── LICENSE                 # MIT License
├── package.json            # Dev dependencies (Jest, jsdom) + scripts
├── .markdownlint.json      # Markdown linting rules
├── .gitignore
├── .dockerignore
├── Dockerfile              # Multi-stage container build for the portfolio site
├── docs/                   # Portfolio web app (GitHub Pages source)
│   ├── index.html          # Entry point
│   ├── app.js              # Application logic (~22k LOC)
│   └── style.css           # Styles
├── tests/                  # Jest test suites
│   └── app.test.js         # Portfolio app tests (jsdom environment)
└── .github/
    ├── workflows/          # CI, Pages deploy, Docker, CodeQL, linting
    ├── ISSUE_TEMPLATE/     # Bug report, feature request templates
    ├── dependabot.yml      # Automated dependency updates
    ├── copilot-setup-steps.yml    # AI agent bootstrap
    └── copilot-instructions.md    # AI agent context
```

---

## Making Changes

### Before You Start

1. Check existing [issues](https://github.com/sauravbhattacharya001/sauravbhattacharya001/issues) to avoid duplicate work
2. For large changes, open an issue first to discuss the approach
3. For README content changes, preview on GitHub — rendering can differ from local editors

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<short-name>` | `feature/project-timeline` |
| Bug fix | `fix/<issue>-<short-name>` | `fix/24-keyboard-dismiss` |
| Docs | `docs/<topic>` | `docs/architecture-update` |
| CI | `ci/<change>` | `ci/add-caching` |
| Refactor | `refactor/<scope>` | `refactor/timeline-module` |

### Guidelines

- **One concern per PR** — don't mix a README update with a JS refactor
- **Read the code first** — understand existing patterns before changing them
- **Test your changes** — `npm test` must pass before submitting
- **Preview rendering** — For markdown changes, check the GitHub rendering (push to your fork)
- **Keep it scannable** — Profile READMEs should be glanceable, not walls of text

---

## Testing

Tests use **Jest** with **jsdom** for DOM simulation:

```bash
npm test                              # Run full suite (jest --verbose)
npx jest --watch                      # Watch mode
npx jest --coverage                   # Coverage report
npx jest tests/app.test.js            # Specific file
npx jest -t 'should filter projects'  # Specific test by name
```

### Writing Tests

- Test files go in `tests/` with `.test.js` extension
- Use jsdom for DOM testing (configured in jest setup)
- Test behavior and user interactions, not internal implementation
- Cover edge cases: empty states, error conditions, boundary values
- Add regression tests for every bug fix

### What to Test

| Change Type | Required Tests |
|-------------|---------------|
| New UI feature | User interaction + DOM output assertion |
| Bug fix | Regression test reproducing the bug |
| Utility function | Unit test with edge cases |
| API/data change | Integration test with mock data |
| CSS-only change | Visual check (manual), no automated test needed |
| README-only change | Markdown lint pass (CI handles this) |

---

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body with details]
```

### Types

| Type | When |
|------|------|
| `feat` | New feature or section |
| `fix` | Bug fix |
| `docs` | Documentation changes (README, PROJECTS, inline) |
| `style` | Formatting (no logic change) |
| `refactor` | Code restructuring without behavior change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `ci` | CI/CD workflow changes |
| `chore` | Config, tooling, housekeeping |
| `security` | Security hardening |

### Scopes

`readme`, `portfolio`, `app`, `tests`, `ci`, `docker`, `docs`, `deps`

### Examples

```
feat(portfolio): add project timeline visualization
fix(app): prevent XSS in project description rendering
docs(readme): update AI safety research section
test(app): add coverage for dark mode toggle
ci: cache npm dependencies in build workflow
```

---

## Pull Request Process

1. **Fork** → **Branch** → **Commit** → **Push** → **Open PR**
2. Fill in the PR template with:
   - What changed and why
   - How to test/verify
   - Screenshots for visual changes
3. Ensure all CI checks pass:
   - ✅ Tests (`npm test`)
   - ✅ Markdown linting
   - ✅ Build/deploy validation
4. Request review from `@sauravbhattacharya001`
5. Address review feedback with fixup commits, then squash on merge

### Review Criteria

- Does it maintain the professional tone of the profile?
- Are there tests for new behavior?
- Does it work in both light and dark GitHub themes?
- Is the change necessary and well-scoped?
- Does the portfolio app remain accessible (keyboard + screen reader)?

---

## Markdown Linting

The project uses [markdownlint](https://github.com/DavidAnson/markdownlint) with rules in `.markdownlint.json`:

```bash
# Lint all markdown files (CI does this automatically)
npx markdownlint-cli2 "**/*.md" --fix
```

Common rules enforced:
- Consistent heading styles (ATX `#`)
- No trailing whitespace
- Single trailing newline
- Proper list indentation
- No bare URLs (use `[text](url)` format)

Fix lint errors before submitting — CI will block on failures.

---

## Portfolio App Guidelines

The portfolio (`docs/app.js`) is a vanilla JavaScript application. Follow these patterns:

### Architecture

- **No frameworks** — pure DOM APIs, event delegation, requestAnimationFrame
- **Module pattern** — IIFEs or object literals for namespace isolation
- **Progressive enhancement** — core content works without JavaScript
- **Zero runtime dependencies** — everything is hand-written

### Performance

- Keep total bundle (HTML + JS + CSS) under 100KB gzipped
- Debounce/throttle scroll and resize handlers
- Use `IntersectionObserver` for lazy loading
- Minimize DOM mutations — batch reads/writes
- Test on throttled network (DevTools → 3G) before submitting

### Security

- **Always** use `textContent` for user-influenced data, never `innerHTML`
- Sanitize any data from URL parameters (`location.hash`, query strings)
- CSP headers are configured in the Dockerfile — don't weaken them
- No inline event handlers (`onclick=`); use `addEventListener`

### Accessibility

- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`
- All images need `alt` text
- Interactive elements need focus indicators
- Color contrast: minimum WCAG AA (4.5:1)
- Test with keyboard only (Tab, Enter, Escape, Arrow keys)

---

## Docker Development

The portfolio runs in a containerized nginx-alpine setup:

```bash
# Build the image
docker build -t portfolio .

# Run locally
docker run -p 8080:80 portfolio

# Access at http://localhost:8080
```

When modifying the Dockerfile:
- Maintain multi-stage build (build → serve)
- Keep the final image minimal (alpine-based)
- Don't run as root (`USER nginx` or equivalent)
- Include health check (`HEALTHCHECK` directive)
- Test with `docker run` before pushing changes

---

## Reporting Issues

Use the [issue templates](https://github.com/sauravbhattacharya001/sauravbhattacharya001/issues/new/choose):

### Bug Reports

Include:
1. **Summary** — What's broken, in one sentence
2. **Steps to reproduce** — Exact steps to trigger
3. **Expected vs. actual** — What should happen vs. what does
4. **Environment** — Browser, OS, screen size
5. **Screenshots** — If visual

### Feature Requests

Include:
1. **Problem** — What limitation does this address?
2. **Proposal** — Concrete description of the desired behavior
3. **Alternatives** — Other approaches considered
4. **Priority** — Nice-to-have vs. important

---

## Code of Conduct

Be respectful, constructive, and professional. We're building something useful together.

- **Be kind** — Assume good intent
- **Be specific** — Actionable feedback over vague criticism
- **Be patient** — Maintainers have other commitments
- **Be inclusive** — Welcome newcomers, explain context

---

## Questions?

Open a [discussion](https://github.com/sauravbhattacharya001/sauravbhattacharya001/issues) — happy to talk through ideas before you invest time implementing them.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
