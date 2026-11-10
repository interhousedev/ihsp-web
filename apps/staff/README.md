<p align="center">
  <img src="../../docs/assets/banners/staff.svg" alt="IHT Teachers" width="880">
</p>

# IHT Teachers

Teachers and curators: journal, attendance, work-offs and classes.

## Overview

- Package `@ihsp/staff`, a statically exported Next.js 16 app in the `iht-web` workspace.
- Production host: `staff.ihsu.uz`. Dev port: 3003.
- Shared code lives in `packages/*` (`@ihsp/ui`, `@ihsp/api`, `@ihsp/auth`, `@ihsp/i18n`); UI text is in `messages/<locale>` for uz, ru and en.

## Run

```bash
bun install --frozen-lockfile        # once, at the repository root
cd apps/staff && bun run dev           # http://localhost:3003, needs the backend on :8000
cd apps/staff && bun run test          # tests of this app
bun run --filter ./apps/staff build    # static export to apps/staff/out
```

## Configuration

Runtime configuration comes only from `/env.js` (`window.__ENV__`): `public/env.js` in development, rendered by `deploy/entrypoint.sh` in the container. Read it through `getConfig()` from `@ihsp/config`, never at module scope.

## Screens

Screenshots live in `docs/assets/screens/` at the repository root. Expected files: `staff-journal.png`, `staff-attendance.png`, `staff-classes.png`.

![IHT Teachers: journal](../../docs/assets/screens/staff-journal.png)

![IHT Teachers: attendance](../../docs/assets/screens/staff-attendance.png)

![IHT Teachers: classes](../../docs/assets/screens/staff-classes.png)

## Links

- [Repository README](../../README.md) and [CODESTYLE.md](../../CODESTYLE.md)
- Backend: the sibling repository `iht-backend`; the contract is `packages/api/openapi.json`
