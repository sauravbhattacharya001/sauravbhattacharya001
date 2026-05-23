# Security Model

A profile/portfolio site is a small attack surface — but small isn't
zero. This page documents what we defend against, what we don't, and
where to report a problem.

For the user-facing vulnerability disclosure policy, see the
top-level [SECURITY.md](../SECURITY.md). This page is the engineering
companion.

## Threat model

| Threat | In scope? | Mitigation |
|---|---|---|
| XSS via project data | Yes | All DOM output goes through `html-helpers.js`, which uses `textContent` not `innerHTML`. |
| XSS via deep-link hash | Yes | `deep-link.js` caps length & pair count; deserialised values are treated as opaque strings, never injected as HTML. |
| Supply-chain compromise (CDN) | Yes | All first-party JS/CSS pinned via SRI (`sha384-…`) in `docs/index.html`. Deploy job verifies hashes match bytes. |
| Supply-chain compromise (npm) | Yes | Dependabot watches `package.json`. Runtime has zero npm deps. |
| Tag/release tampering | Partial | Tags are not signed today. Release flow is documented in [releases.md](releases.md). |
| Credential theft via Actions | Yes | Workflows use `GITHUB_TOKEN` only — no long-lived PATs. `permissions:` is locked down per workflow. |
| Account takeover of the owner | Out of scope | (covered by the owner's personal 2FA + recovery plan) |
| DDoS against the deployed site | Out of scope | GitHub Pages is the CDN. |

## Subresource Integrity

`docs/index.html` pins every first-party script and stylesheet with a
SHA-384 SRI hash:

```html
<script src="app.js" integrity="sha384-..." crossorigin="anonymous"></script>
```

The `pages.yml` deploy job re-derives the hash from the file bytes
and refuses to deploy on mismatch. If you change `app.js` or
`style.css`, regenerate the hashes (see
[development.md](development.md#updating-sri-hashes-after-editing-appjs-or-stylecss)).

There are intentionally no external CDN scripts. If you're about to
add one, **first** justify why a vendored copy isn't acceptable.

## Content Security Policy

A CSP meta tag in `docs/index.html` restricts script sources to
`'self'` and style sources to `'self'` plus the small set of
`unsafe-inline` styles that legacy browsers need for SVG fallbacks.
Don't relax it without a security review.

## Secrets

No runtime secrets. Workflow secrets are limited to:

- `GITHUB_TOKEN` (auto-injected, short-lived)

There is no `.env`, no API key file, no service account JSON anywhere
in the repo. If a workflow needs a secret beyond `GITHUB_TOKEN`,
discuss it as a security review *before* the workflow lands.

## Vulnerability reporting

See [SECURITY.md](../SECURITY.md). The TL;DR is: open a private
security advisory on GitHub; don't file public issues.

## Past incidents

None disclosed publicly to date. When one happens, it gets added here
with a date, root cause, and link to the fix commit. Transparency is
part of the model.
