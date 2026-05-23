# Release Process

Releases here are lightweight — the site itself is continuously
deployed on every push to `master`. A "release" exists to:

1. Tag a known-good snapshot for the npm package
   `@sauravbhattacharya001/portfolio` (used by downstream tooling that
   wants to embed the projects index).
2. Provide a human changelog so visitors can answer "what changed
   between v2.1.0 and v2.1.1?".

## Versioning

Strict [SemVer 2.0.0](https://semver.org/):

| Bump | Trigger |
|---|---|
| MAJOR | Breaking change to `PROJECTS.md` schema, deep-link format, or any module's public API. |
| MINOR | New module, new feature, new label set, new workflow that downstream consumers might rely on. |
| PATCH | Bug fixes, copy edits, design tweaks, performance work. |

The current version is recorded in `package.json` — that's the source
of truth.

## Cutting a release

```bash
# 1. Bump the version (commits and tags atomically)
npm version patch    # or minor / major
# 2. Push the commit and the tag
git push origin master --follow-tags
# 3. Draft a release from the tag
gh release create v$(node -p "require('./package.json').version") \
  --title "v$(node -p "require('./package.json').version")" \
  --notes-file <(git log --pretty=format:'- %s' "$(git describe --tags --abbrev=0 HEAD~1)..HEAD")
```

The `publish.yml` workflow picks up the tag and pushes the npm
package to GitHub Packages.

## Changelog format

Use [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) headings:

```markdown
### Added
- New `seo` auto-label covering `docs/sitemap.xml`.

### Changed
- Tightened deep-link cap from 4096 → 2048 characters.

### Fixed
- Rheology playground no longer NaNs at very low shear rates.

### Security
- (only when applicable; cross-reference CVE / advisory)
```

Don't dump raw `git log` output into the release notes — curate.

## Smoke-test after release

After the `publish.yml` workflow finishes:

```bash
# Verify the published version matches the tag
npm view @sauravbhattacharya001/portfolio version --registry https://npm.pkg.github.com
```

If the published version is missing or wrong, **don't try to fix it
in-place** — bump the patch number and cut a new release.

## Rolling back

Tags are immutable. To "undo" a release, cut the next patch as a
revert:

```bash
git revert <bad-commit>
npm version patch
git push origin master --follow-tags
```

The bad release stays in the history as a record. That's a feature.
