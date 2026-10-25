# CLAUDE.md (iht-web)

Instructions for Claude Code working in this repository. Read [README.md](README.md) for the apps, local development, deployment and CI, and [CODESTYLE.md](CODESTYLE.md) for the coding rules. This file does not repeat them.

## What this is

The web side of the IHT lyceum platform (internal name IHSP): eight statically exported Next.js 16 apps in `apps/*` (id, sp = my.iht, staff = "IHT Учителям", admin, lms, library, share, landing) and shared packages in `packages/*`, as Bun workspaces. The backend (FastAPI) is the sibling repository `iht-backend`; the two meet at the OpenAPI document. The school week is Monday to Friday; the timezone is Asia/Tashkent; the UI languages are uz, ru and en.

## Where things live

- `apps/<app>/src` and `apps/<app>/messages/<locale>/*.json`: app code and app-specific messages.
- `packages/ui` (components, icon registry), `packages/api` (generated types, client, endpoints, vendored `openapi.json`), `packages/auth`, `packages/config`, `packages/features-core` (assistant, notebooks, library, flash cards, mail, notifications, PWA, shell), `packages/i18n`, `packages/telegram`, `packages/test-utils` (preload, fixtures, MSW handlers).
- `deploy/`: nginx image, entrypoint, CSP hashing and their tests. `e2e/`: Playwright specs.

## Commands

```bash
bun install --frozen-lockfile
bun run check                              # oxlint, oxfmt --check, typecheck of all workspaces, e2e typecheck
bun run lint && bunx oxfmt --check . && bun run --filter '*' typecheck
cd apps/sp && bun run test                 # per package or app; a bare `bun test` fails ("/env.js was not loaded")
bun test apps packages                     # whole suite from the root
bun test deploy                            # deploy scripts
bun run sync:openapi                       # copy the backend's openapi.json, then gen:api and gen:contract
bun run contract:check
```

Use oxlint and oxfmt, never prettier or eslint. Run `bun run test` only for the workspaces you touched while iterating, and the full loop once at the end.

## Contract workflow

`packages/api/openapi.json` is a vendored copy of `iht-backend/openapi/openapi.json`. When the backend changes a route or schema, run `bun run sync:openapi` (it reads `${IHSP_BACKEND_DIR:-../iht-backend}/openapi/openapi.json`), then fix the endpoint types, MSW handlers and fixtures that no longer match, and commit the document and the generated files together. Do not edit generated files by hand. Report backend deviations instead of working around them.

## Working rules

- **Use parallel subagents.** Work fast: split independent work among parallel Sonnet subagents (about 7 to 10 at most), each with a precise, self-contained task and its own set of files.
- **Layered commits.** One commit per feature or fix, never one mega commit. Subagents never run git; the coordinator commits. If signing fails (1Password), commit with `git -c commit.gpgsign=false commit ...`.
- **Keep memory safe.** Build the apps one at a time (`bun run --filter ./apps/<app> build`), never `bun run build` of all seven in parallel on a small machine, and do not run the Docker web image build the long way while other heavy work runs.
- **Never print or commit secrets.** There are none in this repository. Keys for the backend (OpenRouter, Exa) live only in git-ignored files of `iht-backend`.
- **UniLibrary.** Never spoof the `Origin` or `Referer` of requests to `api.unilibrary.uz`; the browser must not call it with a forged origin either. Library external search goes through the backend.
- **All UI text in uz, ru and en**, added to all three locales at once (a parity test checks it). Terms: "Промежуточный контроль (ПК)" and "Итоговый контроль (ИК)"; never "Рубежный контроль". Follow the copy rules in CODESTYLE.md (no page subtitles, no restating dialog descriptions).
- **Static export only.** No server features; Suspense around anything that reads the URL; runtime config only through `/env.js`.
- **AI features are soft-limited at runtime.** Limits are edited by administrators on the admin "Limits & usage" page; the web shows the backend's numbers and never hard-codes limits. The default model is `anthropic/claude-haiku-5.5` with reasoning off and the smart tier is `google/gemini-3.8-flash` (both chosen by the backend); the UI must not assume a model. Structured-output JSON schemas on the backend have at most 16 union or nullable parameters; this matters when a new Studio artifact needs a schema field.
- **Icons** only through the registry in `packages/ui/src/components/icons.tsx`.
- **Tests first**, with MSW handlers and fixtures kept in step with the OpenAPI types.

## Product facts the code relies on

- Roles: student, teacher, admin, lms_admin, lms_creator, librarian. Telegram mini app sessions never reach the admin app.
- Sign-in is Ory Hydra OAuth with PKCE through the `id` app; the access token (10 minutes) is kept in memory, the refresh token is an HttpOnly cookie on the API host. A 401 can arrive at any time (blocking a user bumps the session epoch).
- `app.ihsu.uz` is the installable build of `sp` (APP_MODE `pwa`); `my.ihsu.uz` is the plain site and the Telegram mini app. `PWA_APPS` can make lms, library, staff and admin installable.
- Web search (Exa) is a switch in the assistant and notebooks; quota errors come back as problem+json types the UI translates.

## Documentation policy

The repository is open source. The allowed Markdown files are `README.md` files, `CODESTYLE.md`, this file, the community files (`CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md`) and the project skills in `.claude/skills/<name>/SKILL.md`. Do not add design documents, plans or reports to the repository. Update README.md, CODESTYLE.md or the matching skill when behaviour or rules change.
