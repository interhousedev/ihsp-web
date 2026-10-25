---
name: testing
description: Use when writing or running tests in iht-web - unit tests with bun and happy-dom, MSW handlers in packages/test-utils, message parity, Uzbek apostrophe handling, or Playwright e2e with axe.
---

# Testing in iht-web

Tests come first. Test behaviour, one behaviour per test, named as a sentence.

## Running
- Inside a workspace: `bun run test` (e.g. `cd apps/sp && bun run test`). A bare `bun test` there fails with "/env.js was not loaded": the package script passes `--preload` of `packages/test-utils/src/preload.ts`, which sets `window.__ENV__`, happy-dom and the MSW server.
- From the root: `bun test apps packages`; deploy scripts: `bun test deploy`.
- Iterate on touched workspaces only; run the whole suite and `bun run check` once at the end.

## MSW handlers
- Handlers live in `packages/test-utils/src/handlers/*.ts`, typed by the generated OpenAPI types, with in-memory state that the preload resets after every test.
- When an endpoint changes, update the handler and the fixtures in the same change.
- `packages/test-utils/src/__tests__/coverage.test.ts` checks that handlers cover the endpoints in `openapi.json`; a new endpoint needs a handler.
- Override per test with `server.use(...)`; prefer factories over large fixtures. Inject time and randomness; mocks are a last resort.

## Messages
- Each app has `src/tests/messages.test.ts`: key sets of uz, ru and en must match. Add keys to all three at once.

## Uzbek apostrophes
- Uzbek uses ʻ (U+02BB) and ʼ (U+02BC); users also type `'`, `` ` `` and ‘ ’. Search folds all forms and Uzbek Cyrillic to Latin. Any new search or filter needs a test with the ʼ form (see `packages/features-core/src/notebooks/lib/search-text.test.ts`).

## End to end
- Playwright specs in `e2e/` cover user flows (`UF-...`) against a running backend with demo data (`bun run e2e`; `E2E_STACK=local` for the Docker stack). Typecheck with `bun run e2e:typecheck`.
- Every page check runs axe (`@axe-core/playwright`) and fails on CSP violations. Service workers are blocked.
