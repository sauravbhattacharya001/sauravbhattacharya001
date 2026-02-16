# Copilot Instructions — sauravbhattacharya001 Profile README

## Repository Overview

This is a **GitHub profile README** repository. The `README.md` displayed on
[github.com/sauravbhattacharya001](https://github.com/sauravbhattacharya001)
is the primary artifact. `PROJECTS.md` contains a detailed portfolio of all
public repositories.

## Repository Structure

```
README.md              # Profile README (rendered on GitHub profile page)
PROJECTS.md            # Detailed portfolio of all repos
.markdownlint.json     # Markdownlint config (relaxed rules for profile formatting)
.github/
  workflows/
    ci.yml             # Markdown lint, link checking, badge validation, structure check
  copilot-setup-steps.yml
```

## Key Conventions

- **Markdown only** — no application code in this repo.
- **HTML in Markdown is allowed** — `.markdownlint.json` disables MD033 (inline HTML)
  because the profile README uses `<div align="center">`, `<img>`, and badge HTML.
- **Line length is uncapped** — MD013 is disabled; badge URLs and tables can be long.
- **Tables are used extensively** — project listings use Markdown tables with badges.
- All badge images use `https://img.shields.io` — keep this consistent.
- External links should point to existing repos under `sauravbhattacharya001`.

## Lint & Validation

```bash
# Lint all Markdown files
npx markdownlint-cli2 "**/*.md"

# The CI workflow also runs:
# - Link validation (lychee) — checks all URLs except dynamic badge services
# - Badge validation — curls each shields.io URL
# - Structure validation — ensures key sections exist
```

## Content Guidelines

- **Profile README** should highlight: current projects, research, tech stack,
  GitHub stats, and contact info.
- **PROJECTS.md** has detailed per-repo breakdowns: architecture, features,
  infrastructure, links.
- When adding a new project, update both files.
- Keep release badge versions current (e.g., `v1.0.0`, `v2.0.0`).
- Use consistent table format: `| Project | What it does | Release | Live |`.

## How to Test Changes

1. Run `npx markdownlint-cli2 "**/*.md"` to catch lint issues.
2. Preview `README.md` on GitHub (or a local Markdown previewer) to verify
   rendering — especially tables, badges, and centered sections.
3. The CI will validate links, badges, and structural integrity on push/PR.
