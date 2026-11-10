<p align="center">
  <img src="../../docs/assets/banners/share.svg" alt="IHT Share" width="880">
</p>

# IHT Share

Public read-only pages for shared chats and flash card sets.

## Overview

- Package `@ihsp/share`, a statically exported Next.js 16 app in the `iht-web` workspace.
- Production host: `s.ihsu.uz/ai/`. Dev port: 3006.
- Shared code lives in `packages/*` (`@ihsp/ui`, `@ihsp/api`, `@ihsp/auth`, `@ihsp/i18n`); UI text is in `messages/<locale>` for uz, ru and en.

## Run

```bash
bun install --frozen-lockfile        # once, at the repository root
cd apps/share && bun run dev           # http://localhost:3006, needs the backend on :8000
cd apps/share && bun run test          # tests of this app
bun run --filter ./apps/share build    # static export to apps/share/out
```

## Configuration

Runtime configuration comes only from `/env.js` (`window.__ENV__`): `public/env.js` in development, rendered by `deploy/entrypoint.sh` in the container. Read it through `getConfig()` from `@ihsp/config`, never at module scope.

## Links

- [Repository README](../../README.md) and [CODESTYLE.md](../../CODESTYLE.md)
- Backend: the sibling repository `iht-backend`; the contract is `packages/api/openapi.json`
