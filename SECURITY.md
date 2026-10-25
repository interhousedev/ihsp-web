# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem.

- Preferred: open a private report through [GitHub security advisories](https://github.com/interhousedev/ihsp-web/security/advisories/new).
- Or write to **alex@sayfi.uz**, or on Telegram to **@megaplov**.

Include the affected app and host, steps to reproduce, the impact you expect and, if you have one, a proof of concept. Do not access other people's data, run denial-of-service tests or social-engineer staff or students; this platform serves a school and real minors.

We aim to acknowledge a report within 3 working days (Monday to Friday, Tashkent time) and to agree a disclosure date with you once a fix is ready. We credit reporters in the advisory unless you ask us not to.

## Supported versions

Only the latest release and `main` receive security fixes. The production deployment always runs a recent release.

## Scope

In scope: the apps in this repository, the nginx image built from `deploy/`, its CSP and headers, and the browser side of authentication. Backend issues (API, bot, MCP) belong to the backend repository but may be reported through the same channels.

## Security design in short

See the [Security section of the README](README.md#security): PKCE sign-in, an in-memory access token, an HttpOnly refresh cookie, a strict hash-based CSP, no server runtime, an allowlisted OpenUI renderer, and signed images with SBOM and Trivy scans.
