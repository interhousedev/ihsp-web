<p align="center">
  <img src="../../docs/assets/banners/library.svg" alt="IHT Library" width="880">
</p>

# IHT Library

Catalogue, reader and librarian tools.

## Overview

- Package `@ihsp/library`, a statically exported Next.js 16 app in the `iht-web` workspace.
- Production host: `lib.ihsu.uz`. Dev port: 3008.
- Shared code lives in `packages/*` (`@ihsp/ui`, `@ihsp/api`, `@ihsp/auth`, `@ihsp/i18n`); UI text is in `messages/<locale>` for uz, ru and en.

## Run

```bash
bun install --frozen-lockfile        # once, at the repository root
cd apps/library && bun run dev           # http://localhost:3008, needs the backend on :8000
cd apps/library && bun run test          # tests of this app
bun run --filter ./apps/library build    # static export to apps/library/out
```

## Configuration

Runtime configuration comes only from `/env.js` (`window.__ENV__`): `public/env.js` in development, rendered by `deploy/entrypoint.sh` in the container. Read it through `getConfig()` from `@ihsp/config`, never at module scope.

## Screens

Screenshots live in `docs/assets/screens/` at the repository root.

![IHT Library: catalog](../../docs/assets/screens/library-catalog.png)

![IHT Library: librarian](../../docs/assets/screens/library-librarian.png)

## Links

- [Repository README](../../README.md) and [CODESTYLE.md](../../CODESTYLE.md)
- Backend: the sibling repository `iht-backend`; the contract is `packages/api/openapi.json`
