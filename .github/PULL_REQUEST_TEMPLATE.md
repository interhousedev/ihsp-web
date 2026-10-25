## What and why

<!-- One or two sentences. Link the issue: Closes #123 -->

## Apps touched

- [ ] id  - [ ] sp  - [ ] staff  - [ ] admin  - [ ] lms  - [ ] share  - [ ] library  - [ ] landing  - [ ] packages  - [ ] deploy

## Checklist

- [ ] Tests written first and passing (`bun run test` in the touched workspaces)
- [ ] `bun run check` is clean
- [ ] New text exists in uz, ru and en
- [ ] Static export rules hold (Suspense around URL readers, no dynamic segments, no server features)
- [ ] After a backend contract change: `bun run sync:openapi` and the generated files are committed
- [ ] CSP updated and checked end to end if a script, worker or origin was added
- [ ] Screenshots for UI changes (360 px and desktop, light and dark)

## Screenshots
