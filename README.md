# iht-web

Web apps of the IHT platform: the student and staff platform of the Academic Lyceum International House Tashkent (internal name IHSP, Interhouse Student Platform). It covers daily school life: calendar, marks, homework, attendance, an AI study assistant with notebooks, a library, courses (LMS), files and links, a student mailbox and a Telegram mini app.

The backend lives in the sibling repository `iht-backend`. This repository holds seven statically exported Next.js apps, the shared packages, the nginx image that serves them, and the end-to-end tests.

## Apps and hosts

| Product | Directory | Production host | Dev port | For |
|---|---|---|---|---|
| my.iht | `apps/sp` | `my.ihsu.uz`, installable app on `app.ihsu.uz` | 3002 | students |
| IHT Учителям | `apps/staff` | `staff.ihsu.uz` | 3003 | teachers, curators |
| admin.iht | `apps/admin` | `admin.ihsu.uz` | 3004 | administration |
| lms.iht | `apps/lms` | `lms.ihsu.uz` | 3005 | courses |
| library.iht | `apps/library` | `lib.ihsu.uz` | 3008 | library |
| IHT ID | `apps/id` | `id.ihsu.uz` | 3001 | sign-in, registration, security (single sign-on through Ory Hydra) |
| Shares | `apps/share` | `s.ihsu.uz/ai/` | 3006 | public shared chats and flash card sets |

The API and MCP servers are `api.ihsu.uz` and `mcp.ihsu.uz`, served by iht-backend. The directory name `sp` is historic; the product is my.iht.

## Architecture

- Next.js 16 with `output: "export"`: every app is plain static files, with no Node server in production. React 19, TypeScript `strict`, Tailwind CSS 4, shadcn/ui (`base-nova`, Base UI), TanStack Query and Form, Zod 4, `nuqs`, Zustand, `next-intl` without locale routing (uz, ru, en).
- Bun workspaces: `apps/*` and `packages/*`.
- One build runs in every environment. Runtime configuration comes from `/env.js` (`window.__ENV__`), rendered at container start from environment variables; `@ihsp/config` reads it.
- The apps talk to the backend through a typed client generated from the backend's OpenAPI document (`openapi-typescript`, `openapi-fetch`). Sign-in is OAuth with PKCE against Ory Hydra; the access token lives only in memory.
- The image is `nginxinc/nginx-unprivileged` on port 8080 and routes by `Host` to the right app. Inline scripts are allowed by SHA-256 hashes written into a CSP meta tag after the build (`deploy/csp-hash.ts`).

## Repository layout

| Path | Content |
|---|---|
| `apps/` | `id`, `sp`, `staff`, `admin`, `lms`, `library`, `share` |
| `packages/ui` | shadcn/ui primitives, layout, data tables, theme |
| `packages/api` | generated API types, fetch client, query keys, endpoint types, the vendored `openapi.json`, contract check scripts |
| `packages/auth` | OIDC with PKCE, token store, role guards, mini-app login |
| `packages/config` | `window.__ENV__` loader and validation |
| `packages/features-core` | features shared by several apps: assistant, notebooks, library, flash cards, mail, notifications, PWA, shell |
| `packages/i18n` | shared messages and the `useT` hook |
| `packages/telegram` | Telegram mini app support |
| `packages/test-utils` | test preload, fixtures, MSW handlers typed by the OpenAPI types |
| `packages/tsconfig` | shared TypeScript configs |
| `deploy/` | nginx image: `Dockerfile`, `Dockerfile.prebuilt`, `entrypoint.sh`, `env.js.template`, `csp-hash.ts`, `sites/`, `snippets/`, tests |
| `e2e/` | Playwright specs |

## Prerequisites

- [Bun](https://bun.sh) 1.3.
- Node 22 types (`@types/node`); Node itself is not needed to run the repository.
- For the full local stack and the end-to-end tests: Docker 28 or newer and a checkout of `iht-backend` next to this repository (`../iht-backend`).

## Local development

```bash
bun install                  # CI and Docker: bun install --frozen-lockfile
bun run dev                  # every app: id 3001, sp 3002, staff 3003, admin 3004, lms 3005, share 3006, library 3008
cd apps/sp && bun run dev    # a single app
```

The apps call the API on `http://localhost:8000` and Hydra on `http://localhost:4444` directly. Start the backend from the `iht-backend` checkout: `scripts/dev.sh all` (plus `worker`, `scheduler` and `bot` in other terminals), then once `uv run python scripts/hydra_bootstrap.py` and `uv run python -m app seed-demo`. Login codes arrive in Mailpit at `http://localhost:8025`.

To run the whole product in Docker instead, use `scripts/local_up.sh` in iht-backend. It builds the apps of this repository on the host, one at a time, and packs them with `deploy/Dockerfile.prebuilt`. It finds this repository at `../iht-web` or at `IHSP_WEB_DIR`. Then open `http://sp.localhost/`.

Demo logins (local stack only): `abdullayev.alisher` / `StudentDemo1`, `usmonov.bobur` / `TeacherDemo1`, `admin.ihsp` / `AdminDemo1` (needs a one-time code from Mailpit), `tursunov.sardor` / `LibrarianDemo1`.

Runtime configuration: in development each app serves its own `public/env.js` with dev values; in the container `deploy/entrypoint.sh` renders `deploy/env.js.template` with `envsubst` from variables such as `IHSP_WEB_API_URL`, `IHSP_WEB_ID_URL`, `IHSP_WEB_HYDRA_URL`, `APP_ENV` and `PWA_APPS`. Never read configuration at module scope; call `getConfig()`.

## Fake and real modes

The web repository has no secrets. Whether the backend uses real EMIS, OpenRouter, Exa or Telegram is decided by the backend's git-ignored `.env.local` (see the iht-backend README). The web apps behave the same in both modes.

## Tests and checks

```bash
bun run check                           # oxlint, oxfmt --check, typecheck of every workspace, e2e typecheck
bun run lint                            # oxlint .
bunx oxfmt --check .                    # formatting (oxfmt, not prettier); bun run format writes it
bun run --filter '*' typecheck          # tsc --noEmit in every workspace
cd apps/sp && bun run test              # one app or package
bun test deploy                         # nginx and entrypoint tests
bun run e2e                             # Playwright against a running backend
```

Always use `bun run test` inside an app or package; a bare `bun test` there fails with "/env.js was not loaded" because the package script passes the preload that sets up `window.__ENV__`, happy-dom and MSW. From the repository root, `bun test apps packages` also works. Playwright needs the backend running with demo data (`E2E_STACK=local` tests the Docker stack instead of the dev servers).

## API contract workflow

The backend exports `openapi/openapi.json`. This repository keeps a copy at `packages/api/openapi.json`; the typed client and the contract check are generated from it.

```bash
bun run sync:openapi        # copies ../iht-backend/openapi/openapi.json (or $IHSP_BACKEND_DIR), then gen:api and gen:contract
bun run contract:check      # the hand-written endpoint types must type-check against the generated types
```

Commit `packages/api/openapi.json` and the generated files together. CI regenerates them from the vendored document and fails when the committed files differ.

## Deployment

CI builds and publishes the image `ghcr.io/<owner>/ihsp-web`. The apps are built on the runner one at a time (a parallel `next build` of seven apps needs too much memory), the CSP hashes are written, and `deploy/Dockerfile.prebuilt` packs the exports into the nginx image. The server (see the iht-backend README) pulls the image; the edge nginx terminates TLS and proxies the static hosts to the `web` container, which serves them by `Host` header. Environment variables of the container are listed at the top of `deploy/entrypoint.sh`. `deploy/Dockerfile` builds everything inside Docker and is meant for machines with plenty of memory.

## Continuous integration

| Workflow | When | What |
|---|---|---|
| `lint.yml` | every push and pull request | `oxlint`, `oxfmt --check`, typecheck of every workspace and of `e2e` |
| `test.yml` | pull requests to `main` | `bun run test` in every workspace, `bun test deploy`, regeneration of the API client from `packages/api/openapi.json` with `git diff --exit-code`, `contract:check`, a secrets scan |
| `build.yml` | pushes to `main`, tags `v*`, manual | builds the apps, builds and pushes `ghcr.io/<owner>/ihsp-web`, SBOM and provenance, Trivy scan (fails on fixable critical and high findings), keyless cosign signature, channel tags |
| `codeql.yml` | pull requests, `main`, weekly | CodeQL for JavaScript and TypeScript |

Dependabot updates the actions, the base images and the Bun dependencies weekly. A tag `v1.2.3` publishes the image as `1.2.3` and bakes that version into the apps (`NEXT_PUBLIC_APP_VERSION`), which the installable app compares with the backend's `GET /v1/app/version`.

## Working on this repository

[CODESTYLE.md](CODESTYLE.md) has the coding rules and [CLAUDE.md](CLAUDE.md) has the instructions for Claude Code.
