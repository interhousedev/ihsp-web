---
name: api-contract
description: Use when the backend API changes, when adding a query/mutation against a new endpoint, or when touching packages/api - covers sync:openapi, contract:check and the generated files.
---

# API contract with iht-backend

`packages/api/openapi.json` is a vendored copy of `iht-backend/openapi/openapi.json`. Everything typed comes from it.

## After a backend change
```bash
bun run sync:openapi     # copies ${IHSP_BACKEND_DIR:-../iht-backend}/openapi/openapi.json, then gen:api and gen:contract
bun run contract:check   # hand-written endpoint types must type-check against the generated ones
```
Then fix endpoint types, MSW handlers and fixtures that no longer match, and commit `openapi.json` with the generated files in one commit.

## Rules
- **Never edit by hand** `packages/api/openapi.json` or `packages/api/src/generated/*`. CI regenerates them and fails on any diff.
- Feature code calls the typed `openapi-fetch` client through `features/<name>/api/{queries,mutations}.ts` factories; shared query keys live in `packages/api` `keys.ts`.
- Errors are `application/problem+json` with a stable `type`; map the type to an i18n key.
- If the backend document is wrong, report the deviation to the backend; do not work around it with casts.
- A removed or renamed field is a breaking change: search all apps and `packages/features-core` before syncing.
