# CI / CD Reference

Every workflow under `.github/workflows/`, why it exists, when it
runs, and how to debug it when it goes red.

## ci.yml

**What:** Top-level "is the repo healthy" job. Runs `npm install`,
`npm test`, and a Markdown lint pass.
**When:** Every push to `master`, every pull request.
**Debug:** Failures here block merges. Reproduce locally with `npm
test` first; the lint pass is `npx markdownlint-cli2 "**/*.md"`.

## test.yml

**What:** The detailed Jest matrix — runs the suite on Node 20 and
Node 22 on `ubuntu-latest` and `windows-latest`. Coverage is uploaded
as an artifact.
**When:** Every push to `master`, every PR, weekly cron.
**Debug:** If only one OS/Node combo fails, the bug is likely
environment-sensitive (line endings, path separators, locale).

## codeql.yml

**What:** GitHub-hosted static analysis for JavaScript.
**When:** Push to `master`, PRs into `master`, weekly cron.
**Debug:** Findings show in the Security tab. False positives go in
the CodeQL "dismiss with reason" flow — never silenced in code.

## docker.yml

**What:** Builds the `Dockerfile` (used to serve `docs/` from a
container for offline previews). Publishes to GHCR on tagged
releases.
**When:** Push to `master`, tag matching `v*.*.*`.
**Debug:** GHCR errors usually mean the workflow's `packages: write`
permission was dropped. Confirm it's still in the `permissions:`
block.

## issue-triage.yml

**What:** Applies starter labels (`needs-triage`, `bug`, etc.) based
on the issue body content. Closes obvious spam.
**When:** Issue `opened` / `reopened`.
**Debug:** This workflow uses `secrets.GITHUB_TOKEN` only — no PATs.
Failures usually mean a label was renamed without updating the
workflow's label list.

## labeler.yml

**What:** Auto-applies file-path labels to PRs via
[actions/labeler@v6](https://github.com/actions/labeler).
**When:** PR `opened` / `synchronize` / `reopened`.
**Debug:** Config lives in `.github/labeler.yml`. Validate it with
`npx jest tests/labeler-config.test.js` before pushing.

## lighthouse.yml

**What:** Runs Lighthouse against the deployed site and posts the
report as an action summary.
**When:** Push to `master`, daily cron.
**Debug:** Informational only. Don't paper over score regressions
here — file them as `performance` issues.

## pages.yml

**What:** Builds and deploys the GitHub Pages site (see
[deploy.md](deploy.md)).
**When:** Push to `master` touching `docs/**`, manual dispatch.
**Debug:** SRI mismatch is the #1 failure mode. The error log
includes the exact regeneration command.

## publish.yml

**What:** Publishes the npm package
`@sauravbhattacharya001/portfolio` to GitHub Packages on tagged
releases.
**When:** Tag matching `v*.*.*`.
**Debug:** Requires `packages: write` permission and a valid
`.npmrc` injected by the workflow. Don't add an npm token as a repo
secret — the action handles auth via `GITHUB_TOKEN`.

## stale.yml

**What:** Marks issues / PRs stale after 60 days of inactivity and
closes them 7 days later. Issues labelled `pinned`, `security`, or
`good first issue` are exempt.
**When:** Daily cron.
**Debug:** This is the most likely workflow to surprise people.
Adjust the exempt list rather than disabling the workflow.

## Adding a new workflow

1. Drop the YAML into `.github/workflows/`.
2. If it adds an auto-applied label, also add it to
   `.github/labeler.yml` *and* `tests/labeler-config.test.js`.
3. Add a row to this page so future-you knows what it does.
4. Push to `master` — there is no PR step (see [CONTRIBUTING.md](../CONTRIBUTING.md)).
