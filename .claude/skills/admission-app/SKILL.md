---
name: admission-app
description: Use for any change in apps/admission (university admission flow, staff caseload, consent screen); not for other apps.
---

# Admission app (`apps/admission`)

A static export like every app (see `static-export-rules`). Students use it on phones; counselors, mentors, transcript officers, teachers and admins use the staff screens.

## Routes (`src/app`)
- Student steps: `/` (home), `/setup/` (profile), `/activities/`, `/plan/`, `/chooser/` (universities), `/documents/`, `/courses/`, `/settings/`, `/licenses/`.
- Staff, under `/staff/`: `/staff/` (caseload), `documents/`, `transcripts/`, `deadlines/`, `catalog/`.
- `/auth/callback` finishes the Hydra PKCE sign-in; `error.tsx` and `not-found.tsx` exist as in every app.
- Navigation is `src/config/nav.ts` (`useNav`): groups Steps, More, Staff; the phone bottom bar holds home, activities, universities, documents. Add a page to the nav and to `app/shared/app_map.py` in the backend.

## Staff vs student
- The staff group is hidden unless `session.user.roles` allows it. `nav.ts` currently lists `teacher` and `admin`; the backend adds `counselor`, `mentor` and `transcript_officer`: extend the check to them, and wrap staff pages in `AdmissionShell roles={[...]}` so a student who types the URL sees a forbidden state, not data.
- The backend is the authority on access; the web only hides and explains.

## No hard-coded option lists
- Every option list, limit and flag (countries, majors, tests, deadline kinds, document kinds, grade scales, caps) comes from `GET /v1/admission/config` (`useAdmissionConfig` in `src/lib/config.ts`, kept fresh 5 min) or from runtime settings the backend serves. Never copy such a list into a component, message file or test fixture constant.
- Labels for option values come from i18n keys keyed by the value, with a fallback to the label the backend sends. The local `AdmissionConfig` type is replaced by the generated one once the route is in `openapi.json` (`api-contract` skill).

## X-IHSP-App
- `packages/api/src/client.ts` sends `X-IHSP-App: <APP_NAME>` on every request; the legal documents and limits are per app. `APP_NAME` is `admission` here (rendered into `/env.js` by `deploy/entrypoint.sh`, asserted in `deploy/docker.test.ts`). Do not set the header by hand; a new app needs `APP_NAME` in its env.

## Consent screen
- `LegalGate` (`@ihsp/features-core`, mounted by `AdmissionShell`) blocks the app until the legal documents for `admission` are accepted (`legal/acceptance-required` problem type).
- Consent to submit or share data is a deliberate act: use `SlideToAgree` from `@ihsp/ui` (`label`, `doneLabel`, `onAgree`; keyboard Enter/Space works; reduced motion jumps). The action runs only in `onAgree`; never auto-agree, never pre-check. All three strings in uz, ru, en.
- Test: the handle is keyboard operable, `onAgree` fires once, `disabled` blocks it.

## Checks
`cd apps/admission && bun run test`; one build: `bun run --filter ./apps/admission build`. Pages use `StepPage`/`StateView` for empty states until data exists; tests in `src/tests`.
