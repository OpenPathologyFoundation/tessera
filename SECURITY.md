# Security Policy

## Reporting a Vulnerability
If you discover a security issue, please report it responsibly.

Preferred disclosure path:
1. Email `info@openpathology.org`.
2. If this repository is hosted on GitHub, use **Security Advisories** to submit a private report.

Please avoid sharing exploit details in public issues until a fix is available.

## Data Handling
- The application is designed to run fully client‑side and store only transient session data in the browser.
- Do **not** include patient identifiers or PHI in bug reports, screenshots, or logs.

## Scope
Security issues include (but are not limited to):
- Cross‑site scripting (XSS) or template injection
- Unsafe clipboard handling or data leakage
- Path traversal or static file exposure in `serve.js`
- Supply‑chain risks from newly added dependencies
