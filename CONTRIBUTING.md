# Contributing to sauravbhattacharya001

Thanks for your interest in improving this GitHub profile and portfolio site! This guide covers everything you need to get started.

## Table of Contents

- [Repository Architecture](#repository-architecture)
- [What You Can Help With](#what-you-can-help-with)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [CI Pipeline](#ci-pipeline)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Security](#security)
- [Code of Conduct](#code-of-conduct)

## Repository Architecture

```
├── README.md              # GitHub profile page (renders on profile)
├── PROJECTS.md            # Full project portfolio with detailed descriptions
├── SECURITY.md            # Security policy and vulnerability reporting
├── docs/                  # Portfolio website (deployed to GitHub Pages)
│   └── app.js             # Main application logic
├── tests/                 # Jest test suites for docs/ site
│   ├── app.test.js        # Core app tests
│   ├── compare.test.js    # Project comparison feature tests
│   ├── modal.test.js      # Modal/UI tests
│   ├── quiz.test.js       # Interactive quiz tests
│   └── untested-functions.test.js
├── __tests__/             # Additional test suites
│   ├── rheology.test.js
│   └── rheologyDashboard.test.js
├── .github/
│   ├── workflows/         # CI/CD (ci, test, codeql, pages, docker, lighthouse)
│   └── ISSUE_TEMPLATE/    # Bug reports, feature requests, content updates
├── Dockerfile             # Multi-stage container build
└── package.json           # Dependencies (jest, jsdom for testing)
```

This is both a **GitHub profile README** (README.md renders on the profile page) and a **portfolio web application** (the `docs/` directory, deployed via GitHub Pages).

## What You Can Help With

| Area | Examples |
|------|----------|
| **Content** | Better project descriptions, new sections, updated stats |
| **Portfolio site** | UI improvements, accessibility, new interactive features in `docs/` |
| **Tests** | Expand coverage, add edge cases, improve test quality |
| **Design** | Layout, badges, dark/light theme compat, responsive improvements |
| **Fixes** | Broken links, typos, rendering issues, CI improvements |
| **Documentation** | PROJECTS.md updates, inline code comments |

## Prerequisites

- **Node.js** 18+ (for running tests)
- **npm** (comes with Node.js)
- **Git** 2.30+
- A text editor that can preview Markdown (VS Code recommended)

## Development Setup

1. **Fork** this repository on GitHub

2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/sauravbhattacharya001.git
   cd sauravbhattacharya001
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run the test suite** to confirm everything works:
   ```bash
   npm test
   ```

5. **Preview the portfolio site** — open `docs/index.html` in your browser, or use a local server:
   ```bash
   npx serve docs
   ```

6. **Preview README rendering** — push to your fork and check on GitHub, or use a Markdown previewer that supports GitHub-flavored Markdown with HTML embeds.

## Making Changes

1. **Create a branch** from `master`:
   ```bash
   git checkout -b <type>/<short-description>
   # e.g., docs/update-agentlens-description
   #       fix/broken-linkedin-badge
   #       feat/add-project-filter
   ```

2. **Make your edits** — follow the existing formatting and code style.

3. **For README/PROJECTS.md changes:**
   - Keep descriptions concise and scannable
   - Verify all links resolve (badges, project URLs, demo links)
   - Check rendering on GitHub — some Markdown features behave differently

4. **For `docs/` changes:**
   - Test in multiple browsers (Chrome, Firefox, Safari)
   - Ensure mobile responsiveness
   - Add or update tests in `tests/` for any new logic

5. **For workflow changes:**
   - Test locally with [act](https://github.com/nektos/act) if possible
   - Don't break existing CI checks

## Testing

The project uses **Jest** with **jsdom** for testing the portfolio site:

```bash
# Run all tests
npm test

# Run a specific test file
npx jest tests/app.test.js

# Run with coverage
npx jest --coverage
```

**Testing guidelines:**
- Every new feature in `docs/` should have corresponding tests
- Aim for meaningful assertions, not just "it doesn't throw"
- Test edge cases: empty data, missing elements, malformed input
- UI tests should use jsdom to verify DOM manipulation

## CI Pipeline

All PRs are validated by multiple GitHub Actions workflows:

| Workflow | What it checks |
|----------|---------------|
| **ci.yml** | Lint, build validation, dependency audit |
| **test.yml** | Full Jest test suite across Node.js versions |
| **codeql.yml** | Static security analysis (CodeQL) |
| **lighthouse.yml** | Performance, accessibility, SEO audits for the portfolio site |
| **pages.yml** | GitHub Pages deployment (on merge to `master`) |
| **docker.yml** | Container build verification |
| **stale.yml** | Auto-close inactive issues/PRs |

All CI checks must pass before a PR can be merged.

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

# Examples:
docs: update AgentLens release version to v1.44.0
fix(readme): repair broken LinkedIn badge URL
feat(docs): add project filtering by language
test: add coverage for modal close behavior
ci: upgrade checkout action to v6
style: fix badge alignment in tech stack section
```

**Types:** `docs`, `fix`, `feat`, `test`, `ci`, `style`, `refactor`, `chore`, `perf`

## Pull Request Process

1. **Target the `master` branch**
2. **Fill in the PR template** — describe what changed and why
3. **Ensure CI passes** — all workflow checks must be green
4. **Keep PRs focused** — one logical change per PR; split large changes
5. **Include screenshots** for visual changes (before/after)
6. **Link related issues** — use `Closes #123` or `Fixes #123`

A maintainer will review within a few days. Small fixes (typos, link repairs) are usually merged quickly. Larger changes may need discussion.

## Security

If you discover a security vulnerability (e.g., in the portfolio site's JavaScript, CI workflows, or Docker configuration), **do not open a public issue**. Instead, follow the process in [SECURITY.md](SECURITY.md) to report it responsibly.

## Code of Conduct

- Be respectful, constructive, and professional
- Welcome newcomers — remember that everyone starts somewhere
- Focus on the work, not the person
- No harassment, discrimination, or personal attacks

## Questions?

- **Before starting work:** Open an issue to discuss your idea — avoids wasted effort
- **During development:** Comment on the issue or draft PR for guidance
- **General questions:** Use the [Discussions](https://github.com/sauravbhattacharya001/sauravbhattacharya001/discussions) tab if enabled, or open an issue

Thank you for contributing! Every improvement — no matter how small — makes a difference. ✨
