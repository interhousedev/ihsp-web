# Code style (web)

How we write web code. When this file and old code disagree, this file wins.

## Principles

1. **Tests first.** No production code without a failing test that needs it. Bug fixes start with a test that reproduces the bug.
2. **One file per logical unit.** One component per file, one hook per file. The file name says what it does: `lesson-card.tsx`, `use-chat-turn.ts`.
3. **Folders are the architecture.** Feature folders; you can find anything from its name.
4. **Business rules in plain code,** frameworks at the edges.
5. **Explicit dependencies.** No globals, no service locators, no import-time side effects. Configuration is read lazily (`getConfig()`), never at module scope.
6. **Types everywhere.** TypeScript `strict`, no `any` without a comment that says why.
7. **Small and boring.** Functions stay under cyclomatic complexity 8. Clear code over clever code; a few lines of duplication over a wrong abstraction.
8. **Errors are part of the design.** Typed errors with a message for the user; nothing is swallowed silently.
9. **Requirement IDs connect everything** (`ACA-11`, `UF-STF-06`, `WEB-7`, `NB-14`). A test `describe` or name starts with the IDs it covers; commits and pull requests name them.

## Tooling

- Package manager and scripts: Bun 1.3. Lint: `oxlint`. Format: `oxfmt`. Not eslint, not prettier.
- `bun run check` is the definition of done: `oxlint .`, `oxfmt --check .`, `tsc --noEmit` in every workspace and the e2e typecheck.
- Tests: `bun test` with `happy-dom`, Testing Library and MSW 2. Run them with `bun run test` inside an app or package; a bare `bun test` there fails with "/env.js was not loaded" because the package script passes `--preload` of `packages/test-utils/src/preload.ts` (it sets `window.__ENV__`, happy-dom, jest-dom matchers and the MSW server). `bun test apps packages` from the repository root also works. `bun test deploy` runs the nginx and entrypoint tests.
- Bun is configured with the hoisted linker and a seven-day release cooldown (`minimumReleaseAge`); add a package to `minimumReleaseAgeExcludes` only when a fresh release is truly needed.

## TypeScript and React

- File names are `kebab-case`; hooks live in `use-*.ts`; tests sit next to the code (`x.test.tsx`).
- Feature folders: `features/<name>/{components,api,schemas,utils}`. `api/` holds `queries.ts` and `mutations.ts` built on the generated client (TanStack `queryOptions` and `mutationOptions` factories and key factories such as `userKeys.detail(id)`; shared keys are in `@ihsp/api` `keys.ts`).
- Server state with TanStack Query, forms with TanStack Form and Zod, URL state with `nuqs`, small client state with Zustand.
- shadcn/ui components live in `@ihsp/ui` and use the `base-nova` style on Base UI. Do not install `@radix-ui/*` or paste old "new-york" snippets. Icons come from `@tabler/icons-react`, but only `packages/ui/src/components/icons.tsx` (the icon registry) may import it; feature code imports icons from `@ihsp/ui`. A test enforces this.
- `@ihsp/ui` must not import `next/navigation`; it takes `pathname` and a link component as props.
- API errors are `application/problem+json` with a stable `type`; translate the type to an i18n key and keep the user's draft on expected failures (for example the typed message on 429 and 503).
- No hard-coded user-facing text. No `console.log` and no TODO without an issue link left behind. No secrets in the repository.

## Static export rules

Every app is a static export. These rules are mandatory:

1. No server-only features: no middleware, route handlers, server actions, `cookies()`, `headers()`, no `rewrites`, `redirects` or `headers` in `next.config`, no ISR, no default image optimizer. Pages are client components that fetch with TanStack Query.
2. No dynamic route segments for runtime data. Entity pages use query parameters (`/lessons/view?id=...`, `/item/?id=...`) read with `nuqs`. The exception is `share`, whose public URLs are fixed (nginx serves one prerendered shell for every `/ai/*` path and the page reads the slug from `location.pathname`).
3. Anything that reads the URL (`useSearchParams`, `nuqs`, `useQueryState`, `useDataTable`) sits inside a `<Suspense>` at page level, or `next build` fails. `next dev` does not show this problem.
4. `trailingSlash: true`; every app has `not-found.tsx` (it becomes `404.html`); `images.unoptimized: true`.
5. Code that touches `window`, `localStorage`, `navigator` or `document` runs in effects or behind `dynamic(() => import(...), { ssr: false })`, because client components are prerendered at build. Persisted stores read `localStorage` after mount.
6. `NEXT_PUBLIC_*` values are inlined at build; runtime configuration goes through `/env.js`. `basePath` is a build-time value (share uses `/ai`); `next/link` is prefixed automatically, plain `<img>`, CSS `url()` and `public/` files are not.
7. No `next/image` (use `<img>`), no `next/font/google` (use `@fontsource-variable/inter`).
8. Theme and sidebar state use `localStorage` through an inline head script, not cookies. The root layout needs `suppressHydrationWarning` on `<html>`.
9. Tailwind 4 does not scan `node_modules`; register package sources in each app's CSS with `@source '../../../../packages/ui/src';`.
10. `html lang` follows the active locale.

Any new inline script, third-party script, worker origin, frame or media origin needs a CSP change (`deploy/csp-hash.ts`, `deploy/snippets/security-headers*.conf`) and an end-to-end check, because the end-to-end tests fail on any CSP violation.

## Internationalization

- All text exists in `uz`, `ru` and `en`. Add every new key to all three locales at once; a parity test checks that the key sets match.
- Messages are in `packages/i18n/messages/<locale>.json` (shared namespaces) and in `apps/<app>/messages/<locale>/*.json`. Keys are camel-namespaced (`assistant.composer.web`, `notebooks.discover.fast`).
- `next-intl` runs on the client without locale routing; `useT` is the hook.
- Terms: "Промежуточный контроль (ПК)" and "Итоговый контроль (ИК)"; never "Рубежный контроль". In Russian "Урок" (not "Занятие"); the LMS glossary is Курс, Модуль, Урок, Шаг. In Uzbek the admin and LMS texts use the apostrophes ʻ and ʼ; search folds all apostrophe forms and Uzbek Cyrillic to Latin. The student app is called my.iht ("SP" is only the code name).
- Copy rules: no page subtitles or `description` under page titles, no dialog descriptions that repeat the title, no hints that state the obvious. Keep one-line hints that prevent mistakes (the 7-day journal edit window, an activation link shown once, Tashkent time).

## Accessibility and layout

- Mobile first: design the 360 px layout before the desktop one. Bottom bar on phones; tables become cards below 768 px; touch targets are at least 44 px.
- Respect safe areas and Telegram theme colors in the mini app.
- Keyboard operable, visible focus, labelled controls, correct roles. End-to-end tests run axe (`@axe-core/playwright`).

## Tests

- Test behaviour, not implementation. One behaviour per test, named as a sentence. Arrange, act and assert are separated by blank lines. Factories over big fixtures.
- Server calls are mocked with MSW handlers from `@ihsp/test-utils`, typed by the generated OpenAPI types. Handlers keep in-memory state that `preload.ts` resets after every test. When a backend endpoint changes, update the handler and the fixtures together.
- Time and randomness are injected. Mocks are a last resort.
- Playwright (`e2e/`) covers key user flows (`UF-...`) against a running backend; service workers are blocked in tests.

## Contract with the backend

`packages/api/openapi.json` is a vendored copy of the backend's document. Never edit it or the generated files in `packages/api/src/generated/` by hand; run `bun run sync:openapi`. `contract:check` fails when a hand-written endpoint type disagrees with the schema; fix the type, or report the backend deviation.

## Git

- Conventional Commits with a scope, lowercase imperative (`feat(sp): ...`, `fix(web/packages): ...`); name requirement IDs in the body.
- Layered commits: one per feature or fix, never one mega commit.
- Pull requests carry their tests, pass CI, and include screenshots for UI changes.

## Definition of done

- [ ] Tests written first and passing (`bun run test` in the touched workspaces).
- [ ] `bun run check` is clean.
- [ ] i18n keys exist in all three locales.
- [ ] After a backend contract change: `bun run sync:openapi`, generated files committed.
- [ ] No secrets, no `console.log`, no TODO without an issue link.
