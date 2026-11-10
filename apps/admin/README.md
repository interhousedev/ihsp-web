<p align="center">
  <img src="../../docs/assets/banners/admin.svg" alt="IHT Admin" width="880">
</p>

# IHT Admin

Administration: users and roles, broadcasts, knowledge base, AI limits and usage, jobs, logs and face-photo thumbnails.

## Overview

- Package `@ihsp/admin`, a statically exported Next.js 16 app in the `iht-web` workspace.
- Production host: `admin.ihsu.uz`. Dev port: 3004.
- Shared code lives in `packages/*` (`@ihsp/ui`, `@ihsp/api`, `@ihsp/auth`, `@ihsp/i18n`); UI text is in `messages/<locale>` for uz, ru and en.

## Run

```bash
bun install --frozen-lockfile        # once, at the repository root
cd apps/admin && bun run dev           # http://localhost:3004, needs the backend on :8000
cd apps/admin && bun run test          # tests of this app
bun run --filter ./apps/admin build    # static export to apps/admin/out
```

## Configuration

Runtime configuration comes only from `/env.js` (`window.__ENV__`): `public/env.js` in development, rendered by `deploy/entrypoint.sh` in the container. Read it through `getConfig()` from `@ihsp/config`, never at module scope.

## Screens

Screenshots live in `docs/assets/screens/` at the repository root. Expected files: `admin-users.png`, `admin-students.png`, `admin-limits.png`, `admin-broadcasts.png`, `admin-logs.png`.

![IHT Admin: users](../../docs/assets/screens/admin-users.png)

![IHT Admin: students](../../docs/assets/screens/admin-students.png)

![IHT Admin: limits](../../docs/assets/screens/admin-limits.png)

![IHT Admin: broadcasts](../../docs/assets/screens/admin-broadcasts.png)

![IHT Admin: logs](../../docs/assets/screens/admin-logs.png)

## Links

- [Repository README](../../README.md) and [CODESTYLE.md](../../CODESTYLE.md)
- Backend: the sibling repository `iht-backend`; the contract is `packages/api/openapi.json`
