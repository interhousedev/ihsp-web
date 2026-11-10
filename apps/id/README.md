<p align="center">
  <img src="../../docs/assets/banners/id.svg" alt="IHT ID" width="880">
</p>

# IHT ID

Sign-in, registration, one-time codes, Telegram login and account security; the OAuth front end for Ory Hydra (PKCE).

## Overview

- Package `@ihsp/id`, a statically exported Next.js 16 app in the `iht-web` workspace.
- Production host: `id.ihsu.uz`. Dev port: 3001.
- Shared code lives in `packages/*` (`@ihsp/ui`, `@ihsp/api`, `@ihsp/auth`, `@ihsp/i18n`); UI text is in `messages/<locale>` for uz, ru and en.

## Run

```bash
bun install --frozen-lockfile        # once, at the repository root
cd apps/id && bun run dev           # http://localhost:3001, needs the backend on :8000
cd apps/id && bun run test          # tests of this app
bun run --filter ./apps/id build    # static export to apps/id/out
```

## Configuration

Runtime configuration comes only from `/env.js` (`window.__ENV__`): `public/env.js` in development, rendered by `deploy/entrypoint.sh` in the container. Read it through `getConfig()` from `@ihsp/config`, never at module scope.

## Screens

Screenshots live in `docs/assets/screens/` at the repository root. Expected files: `id-sign-in.png`, `id-register.png`, `id-security.png`.

![IHT ID: sign-in](../../docs/assets/screens/id-sign-in.png)

![IHT ID: register](../../docs/assets/screens/id-register.png)

![IHT ID: security](../../docs/assets/screens/id-security.png)

## Links

- [Repository README](../../README.md) and [CODESTYLE.md](../../CODESTYLE.md)
- Backend: the sibling repository `iht-backend`; the contract is `packages/api/openapi.json`
