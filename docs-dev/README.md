# Developer Documentation

> Engineering reference for the `sauravbhattacharya001` portfolio repository.
> If you're a visitor looking for the **public portfolio**, head to
> <https://www.sauravbhattacharya.com>. Everything below is for people who
> want to read, hack on, or contribute to the source.

## 📚 Table of Contents

| Section | What's in it |
|---|---|
| [Architecture](architecture.md) | High-level system map, data flow, browser-script-only design rationale |
| [Local Development](development.md) | Cloning, running locally, common workflows, debugging tips |
| [Testing](testing.md) | Jest setup, test layout, how to add tests, coverage targets |
| [Module Reference](modules.md) | Per-module API surface for everything under `docs/modules/` |
| [Build & Deploy](deploy.md) | GitHub Pages pipeline, SRI verification, sitemap refresh |
| [CI/CD Reference](ci.md) | What every workflow under `.github/workflows/` does and when it runs |
| [Release Process](releases.md) | How versions, tags, and GitHub Releases are cut |
| [Security Model](security.md) | Threat model, SRI, CSP, secrets policy, vulnerability reporting |
| [Glossary](glossary.md) | Project-specific terms (SRI, deep-link cap, rheology, etc.) |

## 🧭 How to navigate this site on GitHub

Every page in this directory is plain Markdown rendered by GitHub.
Internal links (e.g. `architecture.md`) work as relative links in the
GitHub web UI and in any IDE preview. No build step, no toolchain
required to read the docs.

If you'd prefer a fully rendered site, every page in `docs-dev/` is
also valid input for [MkDocs Material](https://squidfunk.github.io/mkdocs-material/);
see [development.md](development.md#mkdocs-preview-optional) for the
opt-in instructions.

## 🆕 Adding new pages

1. Create `docs-dev/<topic>.md`.
2. Link it from the table of contents above.
3. Run `npm test` to make sure the link-integrity test still passes.
4. Push to `master` (this repo does not use feature branches).

The link-integrity test (`tests/docs-dev-links.test.js`) walks every
markdown file in `docs-dev/` and asserts that every relative link
resolves to a real file. That's the only structural constraint.

## 🤝 Contributing

See the top-level [CONTRIBUTING.md](../CONTRIBUTING.md) for the social
contract (DCO, conventional commits, review etiquette). This directory
is the *technical* contract: read [development.md](development.md)
before your first PR.

## 📜 License

Same MIT license as the rest of the repository — see
[LICENSE](../LICENSE).
