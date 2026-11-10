<p align="center">
  <img src="../../docs/assets/banners/sp.svg" alt="my.iht" width="880">
</p>

# my.iht

The student app: today, timetable, marks, homework, AI assistant, notebooks and Studio, mail, files, flash cards. It is also the PWA and the Telegram mini app.

## Overview

- Package `@ihsp/sp`, a statically exported Next.js 16 app in the `iht-web` workspace.
- Production host: `my.ihsu.uz (installable build on app.ihsu.uz)`. Dev port: 3002.
- Shared code lives in `packages/*` (`@ihsp/ui`, `@ihsp/api`, `@ihsp/auth`, `@ihsp/i18n`); UI text is in `messages/<locale>` for uz, ru and en.

## Run

```bash
bun install --frozen-lockfile        # once, at the repository root
cd apps/sp && bun run dev           # http://localhost:3002, needs the backend on :8000
cd apps/sp && bun run test          # tests of this app
bun run --filter ./apps/sp build    # static export to apps/sp/out
```

## Configuration

Runtime configuration comes only from `/env.js` (`window.__ENV__`): `public/env.js` in development, rendered by `deploy/entrypoint.sh` in the container. Read it through `getConfig()` from `@ihsp/config`, never at module scope.

## Screens

Screenshots live in `docs/assets/screens/` at the repository root. Expected files: `sp-home.png`, `sp-timetable.png`, `sp-marks.png`, `sp-assistant.png`, `sp-notebooks.png`.

![my.iht: home](../../docs/assets/screens/sp-home.png)

![my.iht: timetable](../../docs/assets/screens/sp-timetable.png)

![my.iht: marks](../../docs/assets/screens/sp-marks.png)

![my.iht: assistant](../../docs/assets/screens/sp-assistant.png)

![my.iht: notebooks](../../docs/assets/screens/sp-notebooks.png)

## Links

- [Repository README](../../README.md) and [CODESTYLE.md](../../CODESTYLE.md)
- Backend: the sibling repository `iht-backend`; the contract is `packages/api/openapi.json`
