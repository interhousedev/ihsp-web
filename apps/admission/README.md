# IHT Admission

University admission preparation: profile, activities and honors, plans, universities, documents and deadlines.

## Overview

- Package `@ihsp/admission`, a statically exported Next.js 16 app in the `iht-web` workspace.
- Production host: `admission.ihsu.uz`. Dev port: 3009.
- Every API request carries `X-IHSP-App: admission` (from `APP_NAME` in `/env.js`).
- Option lists, limits and flags come from `GET /v1/admission/config`, never from this app.
- UI text is in `messages/<locale>.json` for uz, ru and en.
- `/career/` connects interests and activities to professions, majors/minors and an evidence-backed distinctive strength. Microphone recording requires explicit consent; audio is sent for transcription and discarded, while the editable transcript becomes an answer. Recording stops after 60 seconds.

## Routes

The logo opens Home (`/`, section cards, Continue, tasks and deadlines). The sidebar has five sections whose parts are route-backed tabs:

| Section | Routes |
|---|---|
| Career & study | `/career/` with `?tab=explore`, `field`, `future` |
| Activities & honors | `/activities/` (items open in a popup, `?item=<id>` or `new`), `/plan/`, `/opportunities/`, `/tests/`, `/courses/` |
| Universities & budget | `/chooser/list/`, `/chooser/search/` (`?view=discover`, `?prefs=1`), `/chooser/budget/` (`?view=scholarships`), `/chooser/institution/` |
| Essays | `/essays/` (tabs include `story`, `examples`, `alignment`), `/essays/edit/` |
| Documents & applying | `/documents/`, `/deadlines/`, `/tasks/`, `/review/`, `/outcomes/` |

Secondary links: `/faq/`, `/help/`, `/settings/` (`?tab=profile`). Staff pages are under `/staff/`, including `/staff/exemplars/` and `/staff/prompt-studio/`. `/setup/` is the first-run wizard, outside the nav.

Old routes (`/journey/`, `/profile/`, `/words/`, `/alignment/`, `/colleges/*`, `/chooser/`, `/chooser/programs/`, `/chooser/scholarships/`, `/opportunities/plan/`, `/activities/view/`) redirect client-side to the new places and keep the query and hash.

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
