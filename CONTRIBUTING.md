# Contributing to iht-web

Thank you for helping. This repository holds the static Next.js apps of the Interhouse Student Platform. Read [README.md](README.md) for the architecture and [CODESTYLE.md](CODESTYLE.md) for the rules; this file is the short path to a good pull request. By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

- [Bun](https://bun.sh) 1.3 is the only tool you need for the apps: `bun install`.
- A running backend (`iht-backend` next to this checkout) for development against real data and for the end-to-end tests. Unit tests need no backend.

## Workflow

1. Open an issue first for anything larger than a small fix.
2. Write the test first. Server calls are mocked with the typed MSW handlers from `@ihsp/test-utils`; update the handler and the fixtures together, and keep the handler coverage test green.
3. Implement. Keep changes small and in the matching feature folder.
4. Run the checks:
   ```bash
   cd apps/<app> && bun run test   # never a bare `bun test` inside a workspace
   bun run check                   # oxlint, oxfmt --check, typecheck, e2e typecheck
   bun run format                  # oxfmt --write
   ```
   Use oxlint and oxfmt; do not add eslint or prettier.
5. Commit with Conventional Commits and a scope (`feat(sp): ...`, `fix(packages/ui): ...`), one commit per feature or fix.
6. Open a pull request with the template filled in and screenshots (phone and desktop, light and dark) for UI changes.

## Rules that break builds when forgotten

- **Static export.** No middleware, route handlers, server actions, `cookies()` or `headers()`. Entity pages use query parameters, not dynamic segments. Wrap anything that reads the URL in `<Suspense>`. No `next/image`. Runtime configuration comes from `/env.js` through `getConfig()`, never from module scope.
- **CSP.** A new inline script or third-party origin needs a change in `deploy/csp-hash.ts` or `deploy/snippets/` and an end-to-end check.
- **i18n.** Every string in uz, ru and en at once; a parity test checks it.
- **Icons** only through `packages/ui/src/components/icons.tsx`.

## API contract

`packages/api/openapi.json` is a copy of the backend's document. After a backend change run `bun run sync:openapi` and `bun run contract:check`, and commit the document with the generated files. Never edit `packages/api/src/generated/` by hand.

## Agents

Claude Code and similar tools read [CLAUDE.md](CLAUDE.md) and the project skills in `.claude/skills/`. The same rules apply to their changes.
