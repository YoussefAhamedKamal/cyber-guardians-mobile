# Supply Chain Risk Audit

## Executive Summary

The project has 5 runtime dependencies across 4 packages: React 19, Zustand 5, and the remark/unified ecosystem (react-markdown, remark-gfm). All dependencies are actively maintained, well-known, and show **zero vulnerabilities** via `npm audit`. No high-risk dependencies were identified. The overall supply chain posture is **healthy** with no immediate remediation required.

Each project is organization-backed (Meta/react, remarkjs, pmndrs), has multiple npm maintainers, recent commits (within days), and widespread community adoption. The only minor gap is that 3 of 4 packages lack a `SECURITY.md` policy file, though none have past CVEs affecting the installed versions.

## High-Risk Dependencies

**None.** All dependencies pass the risk criteria with no flags for single-maintainer status, abandonment, low popularity, high-risk features, or past CVEs.

## All Dependencies Summary

| Dependency | Version | Stars | Last Commit | Open Issues | Security Policy | Maintainers | Risk Level |
|---|---|---|---|---|---|---|---|
| react | ^19.1.0 | 245,703 | 2026-06-09 | 1,274 | Yes (SECURITY.md) | 2 (fb, react-bot) | Low |
| react-dom | ^19.1.0 | 245,703 | 2026-06-09 | 1,274 | Yes (SECURITY.md) | 2 (fb, react-bot) | Low |
| react-markdown | ^10.1.0 | 15,756 | 2026-06-09 | 5 | No | 3 (johno, wooorm, remcohaszing) | Low |
| remark-gfm | ^4.0.1 | 1,215 | 2026-06-07 | 2 | No | 3 (johno, wooorm, remcohaszing) | Low |
| zustand | ^5.0.13 | 58,244 | 2026-06-09 | 3 | No | 3 (daishi, jeremyrh, drcmda) | Low |

### Risk Analysis Per Dependency

**react / react-dom (v19.1.0)**
- Owner: react org (Meta) — large organization, not single-maintainer
- Stars: 245K+ — extremely popular
- Last commit: June 9, 2026 — actively maintained
- SECURITY.md: Present
- Past CVEs (v19): 0 confirmed via npm audit
- Risk features: None (no FFI, eval, native code)
- Verdict: **Low** — gold standard supply chain

**react-markdown (v10.1.0)**
- Owner: remarkjs org — collective of multiple maintainers
- Stars: 15.7K — well-known
- Last commit: June 9, 2026 — active
- SECURITY.md: Missing (minor gap)
- Past CVEs: 0 confirmed
- Risk features: Markdown parser (parsing untrusted input is an inherent risk, but the library is well-audited and widely used)
- Verdict: **Low**

**remark-gfm (v4.0.1)**
- Owner: remarkjs org
- Stars: 1.2K — lower popularity but same org as react-markdown
- Last commit: June 7, 2026 — active
- SECURITY.md: Missing
- Past CVEs: 0 confirmed
- Verdict: **Low**

**zustand (v5.0.13)**
- Owner: pmndrs org — well-known React ecosystem org
- Stars: 58K — very popular
- Last commit: June 9, 2026 — active
- SECURITY.md: Missing
- Past CVEs: 0 confirmed
- Risk features: None (pure TypeScript state management, no native code)
- Verdict: **Low**

## Recommendations

1. **No urgent action needed.** All dependencies are actively maintained and vulnerability-free at current versions.

2. **Minor — Add SECURITY.md** to react-markdown, remark-gfm, and zustand tracking. Since these are upstream projects (not this repo's responsibility), consider monitoring the unified/remark and pmndrs organizations for security advisories via GitHub Watch.

3. **Lock dependency versions** — Consider pinning exact versions (removing `^`) in production builds to prevent unexpected supply chain issues from semver-range updates, combined with Dependabot/Renovate for controlled updates.

4. **Enable Dependabot** — Configure Dependabot version updates and security alerts on the GitHub repo to automate dependency monitoring.

5. **Monitor remark ecosystem** — Since react-markdown and remark-gfm are markdown parsers capable of processing untrusted user input, ensure user-supplied markdown is sanitized. The `remark-gfm` plugin extends parsing surface area with tables, tasklists, and strikethrough — keep this dependency updated.

6. **CI/CD integrity** — Consider adding `package-lock.json` to version control (already present) and running `npm audit` in CI to catch new vulnerabilities proactively.

## Methodology

- Analyzed `package.json` runtime dependencies only (5 packages)
- Queried GitHub API for stars, archival status, last update, open issues, SECURITY.md
- Queried npm registry for maintainer counts
- Ran `npm audit` for known vulnerabilities
- Assessed against criteria: single maintainer, unmaintained, low popularity, high-risk features, past CVEs, security contact
