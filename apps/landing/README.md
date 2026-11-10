<p align="center">
  <img src="../../docs/assets/banners/landing.svg" alt="IHT Landing" width="880">
</p>

# IHT Landing

The public landing page for applicants and students.

## Overview

- Package `@ihsp/landing`, a statically exported Next.js 16 app in the `iht-web` workspace.
- Production host: `ihsu.uz, www.ihsu.uz`. Dev port: 3009.
- Shared code lives in `packages/*` (`@ihsp/ui`, `@ihsp/api`, `@ihsp/auth`, `@ihsp/i18n`); UI text is in `messages/<locale>` for uz, ru and en.

## Run

```bash
bun install --frozen-lockfile        # once, at the repository root
cd apps/landing && bun run dev           # http://localhost:3009, needs the backend on :8000
cd apps/landing && bun run test          # tests of this app
bun run --filter ./apps/landing build    # static export to apps/landing/out
```

## Configuration

Runtime configuration comes only from `/env.js` (`window.__ENV__`): `public/env.js` in development, rendered by `deploy/entrypoint.sh` in the container. Read it through `getConfig()` from `@ihsp/config`, never at module scope.

## Screens

Screenshots live in `docs/assets/screens/` at the repository root.

![IHT Landing: home](../../docs/assets/screens/landing-home.png)

## Links

- [Repository README](../../README.md) and [CODESTYLE.md](../../CODESTYLE.md)
- Backend: the sibling repository `iht-backend`; the contract is `packages/api/openapi.json`
