---
name: security
description: Use when adding inline scripts, third-party origins, links, HTML rendering, markdown, AI output rendering, or anything touching tokens and auth in iht-web.
---

# Security rules

## CSP
- The CSP forbids inline scripts without a hash. `deploy/csp-hash.ts` writes SHA-256 hashes of inline scripts into the CSP meta tag after the build; its tests are in `deploy/csp-hash.test.ts`.
- A new inline script, worker, frame, media or connect origin needs a change in `deploy/csp-hash.ts` or `deploy/snippets/security-headers*.conf` plus an e2e check (e2e fails on any violation). Never add `unsafe-inline` or `unsafe-eval`.

## HTML and markdown
- No `dangerouslySetInnerHTML` on user or model content. Existing uses are the hashed theme script, chart CSS variables and the admin Telegram preview, whose serializer escapes text. A new use needs an escaping serializer and a test.
- Markdown renders without raw HTML (no `rehype-raw`, no `allowDangerousHtml`).

## Links
- External `href`s from data go through a safe URL check (`safeHttpsUrl` in `packages/features-core/src/openui/safe.ts`): `javascript:`, `data:` and relative URLs are dropped. Open external links with `rel="noopener noreferrer"`.

## OpenUI
- Model output renders only components in the allowlisted catalogue, with strings and lists clamped to the catalogue limits. See the `openui` skill.

## Tokens
- Sign-in is OAuth PKCE via the `id` app against Hydra. The access token lives only in memory (`packages/auth` token store), never in `localStorage`, `sessionStorage`, cookies or logs. The refresh token is an HttpOnly cookie on the API host; the web never reads it.
- Handle a 401 at any time (session epoch bumps). Never put tokens or personal data in URLs.
- No secrets in this repository. Bugsink sends no user data, cookies, headers or IPs.
- Never spoof `Origin`/`Referer` for `api.unilibrary.uz`; library search goes through the backend.
