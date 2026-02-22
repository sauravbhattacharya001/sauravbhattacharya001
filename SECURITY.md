# Security Policy

## Supported Projects

| Project | Actively Maintained |
|---|---|
| [AgentLens](https://github.com/sauravbhattacharya001/agentlens) | ✅ |
| [WinSentinel](https://github.com/sauravbhattacharya001/WinSentinel) | ✅ |
| [AgenticChat](https://github.com/sauravbhattacharya001/agenticchat) | ✅ |
| [sauravcode](https://github.com/sauravbhattacharya001/sauravcode) | ✅ |
| [VoronoiMap](https://github.com/sauravbhattacharya001/VoronoiMap) | ✅ |
| [prompt](https://github.com/sauravbhattacharya001/prompt) | ✅ |
| [everything](https://github.com/sauravbhattacharya001/everything) | ✅ |
| All other repos | Maintained (best-effort) |

## Reporting a Vulnerability

**Please do not open public issues for security vulnerabilities.**

If you discover a security vulnerability in any of my projects, please report it responsibly:

1. **Email:** [online.saurav@gmail.com](mailto:online.saurav@gmail.com)
2. **Subject:** `[SECURITY] <project-name> — <brief description>`

### What to include

- **Project and version** affected
- **Description** of the vulnerability
- **Steps to reproduce** (or proof of concept)
- **Impact assessment** — what an attacker could do
- **Suggested fix** (if you have one)

### Response timeline

| Stage | Timeline |
|---|---|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 1 week |
| Fix or mitigation | Within 2 weeks for critical issues |
| Public disclosure | After fix is released |

### What to expect

- I take security seriously — every report will be reviewed
- Critical vulnerabilities (RCE, auth bypass, data exposure) are prioritized immediately
- You'll receive credit in the fix commit and release notes (unless you prefer anonymity)
- I will not take legal action against good-faith security researchers

## Security Practices

All repositories follow these security practices:

- **CodeQL scanning** — automated static analysis on every push and PR
- **Dependabot** — automated dependency updates for known CVEs
- **Branch protection** — required reviews and status checks before merge
- **CSP headers** — Content Security Policy on all web-facing projects
- **Input validation** — sanitized user input, parameterized queries
- **No secrets in code** — environment-based configuration, CI secret scanning

## Scope

The following are **in scope** for security reports:

- Cross-site scripting (XSS)
- SQL injection
- Remote code execution
- Authentication/authorization bypass
- Sensitive data exposure
- Dependency vulnerabilities with exploitable paths
- Insecure deserialization
- Path traversal

The following are **out of scope**:

- Self-XSS (requires victim to paste code into their own console)
- Issues in third-party dependencies without a demonstrated exploit path
- Rate limiting on demo/documentation pages
- Missing security headers on GitHub Pages (controlled by GitHub)

---

*This policy applies to all repositories under [sauravbhattacharya001](https://github.com/sauravbhattacharya001).*
