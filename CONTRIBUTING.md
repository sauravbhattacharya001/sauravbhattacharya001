# Contributing

Thanks for your interest in improving this GitHub profile! Here's how to contribute.

## What You Can Help With

- **Content suggestions** — Better wording, updated project descriptions, new sections
- **Design improvements** — Layout, badges, visual elements, dark/light theme compatibility
- **Link fixes** — Broken links, outdated URLs, missing references
- **Typo corrections** — Spelling, grammar, formatting issues
- **Project updates** — New projects, status changes, tech stack updates in PROJECTS.md

## Getting Started

1. **Fork** this repository
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/sauravbhattacharya001.git
   cd sauravbhattacharya001
   ```
3. **Create a branch** for your changes:
   ```bash
   git checkout -b improve-readme
   ```
4. **Make your edits** — follow the existing formatting style
5. **Preview rendering** — Check your changes render correctly on GitHub
6. **Commit** with a clear message:
   ```bash
   git commit -m "docs: improve project descriptions section"
   ```
7. **Push** and **open a PR** — describe what you changed and why

## Guidelines

- **Keep it concise** — Profile READMEs should be scannable, not essays
- **Respect the tone** — Professional but approachable
- **Check links** — Every URL should resolve correctly
- **Preview first** — Markdown rendering can vary; always check on GitHub
- **No sensitive info** — Don't add personal contact details, addresses, or private information
- **Use conventional commits** — Prefix commit messages with `docs:`, `fix:`, `feat:`, etc.

## Development Setup

This repo includes automated checks. To run them locally:

```bash
npm install
npm test
```

This runs markdown linting and link validation to catch issues before CI does.

## Reporting Issues

Use the [issue templates](.github/ISSUE_TEMPLATE/) to report:
- **Bugs** — Broken formatting, rendering issues
- **Feature requests** — New sections or improvements
- **Content updates** — Outdated information that needs refreshing

## Pull Request Process

1. Ensure your PR targets the `main` branch
2. Fill in the PR template with a description of your changes
3. CI checks must pass (markdown lint, link validation)
4. A maintainer will review and merge — usually within a few days

## Code of Conduct

Be respectful, constructive, and professional. We're all here to make things better.

## Questions?

Open an issue — happy to discuss ideas before you start working on them.
