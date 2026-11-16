# IHT Admission

University admission preparation: profile, activities and honors, plans, universities, documents and deadlines.

## Overview

- Package `@ihsp/admission`, a statically exported Next.js 16 app in the `iht-web` workspace.
- Production host: `admission.ihsu.uz`. Dev port: 3009.
- Every API request carries `X-IHSP-App: admission` (from `APP_NAME` in `/env.js`).
- Option lists, limits and flags come from `GET /v1/admission/config`, never from this app.
- UI text is in `messages/<locale>.json` for uz, ru and en.
- `/career/` connects interests and activities to professions, majors/minors and an evidence-backed distinctive strength. Microphone recording requires explicit consent; audio is sent for transcription and discarded, while the editable transcript becomes an answer. Recording stops after 60 seconds.

## Run

```bash
bun install --frozen-lockfile        # once, at the repository root
cd apps/admission && bun run dev         # http://localhost:3009, needs the backend on :8000
cd apps/admission && bun run test        # tests of this app
bun run --filter ./apps/admission build  # static export to apps/admission/out
```

## Configuration

Runtime configuration comes only from `/env.js` (`window.__ENV__`): `public/env.js` in development, rendered by `deploy/entrypoint.sh` in the container. Read it through `getConfig()` from `@ihsp/config`.

## Links

- [Repository README](../../README.md) and [CODESTYLE.md](../../CODESTYLE.md)
