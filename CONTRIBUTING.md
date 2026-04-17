# Contributing to sauravbhattacharya001

Thanks for your interest in improving this GitHub profile repository! This guide covers everything you need to get started.

## Table of Contents

- [What You Can Help With](#what-you-can-help-with)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Accessibility & Design](#accessibility--design)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Code of Conduct](#code-of-conduct)

## What You Can Help With

| Area | Examples |
|------|----------|
| **Content** | Better wording, updated project descriptions, new sections |
| **Design** | Layout, badges, visual elements, dark/light theme compat |
| **Links** | Broken links, outdated URLs, missing references |
| **Typos** | Spelling, grammar, formatting issues |
| **Projects** | New projects, status changes, tech stack in PROJECTS.md |
| **Portfolio site** | Improve `docs/` — layout, interactivity, performance |
| **Tests** | Expand test coverage in `__tests__/` and `tests/` |

## Getting Started

1. **Fork** this repository
2. **Clone** your fork locally:

   ```bash
   git clone https://github.com/<your-username>/sauravbhattacharya001.git
   cd sauravbhattacharya001
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Create a branch** for your changes:

   ```bash
   git checkout -b improve-readme
   ```

5. **Make your edits** — follow the existing formatting style
6. **Run tests** to verify nothing breaks (see [Testing](#testing))
7. **Commit** with a clear message (see [Commit Conventions](#commit-conventions))
8. **Push** and **open a PR**

## Development Setup

**Prerequisites:**

- Node.js 18+ and npm
- Git

```bash
npm install          # install dev dependencies (jest, jsdom)
npm test             # run all tests
```

The project uses **Jest** for testing and **jsdom** for DOM simulation. Markdown linting and link validation run in CI.

### Project Structure

```
├── docs/              # Portfolio website (HTML/CSS/JS)
│   └── app.js         # Main application logic
├── __tests__/         # Jest test suites
├── tests/             # Additional test files
├── .github/           # CI workflows, issue/PR templates
├── README.md          # GitHub profile README
├── PROJECTS.md        # Detailed project showcase
├── SECURITY.md        # Security policy
└── package.json       # Node.js project config
```

## Testing

**Always run tests before submitting a PR:**

```bash
npm test
```

When adding new features to the portfolio site (`docs/`), add corresponding tests in `__tests__/`. Tests use Jest + jsdom to validate DOM rendering and interactions.

**What CI checks:**

- ✅ Jest test suite passes
- ✅ Markdown linting (`.markdownlint.json` config)
- ✅ All links resolve correctly

## Accessibility & Design

This profile renders on GitHub and as a portfolio site. Keep these in mind:

- **Dark/light mode** — Test that badges, images, and colors work in both themes
- **Screen readers** — Use descriptive alt text on all images
- **Mobile-friendly** — GitHub renders on mobile; avoid wide tables or fixed-width content
- **Performance** — Keep images optimized; prefer SVG badges over raster where possible
- **No external tracking** — Don't add analytics pixels or third-party tracking scripts

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
docs: improve project descriptions section
fix: correct broken link to portfolio
feat: add tech stack visualization
test: add DOM rendering tests for app.js
style: fix markdown formatting in PROJECTS.md
chore: update dev dependencies
```

Keep commits atomic — one logical change per commit. Write clear messages that explain *what* changed and *why*.

## Pull Request Process

1. Target the `main` branch
2. Fill in the PR template describing your changes
3. Ensure all CI checks pass
4. Keep PRs focused — one concern per PR
5. A maintainer will review within a few days

**For trivial fixes** (typos, broken links): a brief description is fine.
**For larger changes** (new sections, design overhauls): open an issue first to discuss the approach.

## Reporting Issues

Use the [issue templates](.github/ISSUE_TEMPLATE/) to report:

- 🐛 **Bugs** — Broken formatting, rendering issues, test failures
- 💡 **Feature requests** — New sections, design improvements
- 📝 **Content updates** — Outdated information needing refresh

Include screenshots for visual issues. Mention which browser/theme (dark/light) if relevant.

## Code of Conduct

Be respectful, constructive, and professional. We're all here to make things better. Harassment, trolling, and unconstructive criticism won't be tolerated.

## Questions?

Open an issue — happy to discuss ideas before you start working on them.
