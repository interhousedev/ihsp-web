---
name: static-export-rules
description: Use when adding a page, route, URL parameter, image, font, config value or anything that touches window/localStorage in apps/* - every app is a Next.js static export with no server, and these mistakes only show up in next build.
---

# Static export rules

Every app uses `output: "export"` and is served as plain files by nginx. `next dev` hides most violations; `next build` fails on them. Build one app to check: `bun run --filter ./apps/<app> build` (never all apps in parallel on a small machine).

1. **Suspense around URL readers.** Any component using `useSearchParams`, `nuqs`, `useQueryState` or `useDataTable` sits inside `<Suspense>` at page level, or the build fails with a "missing Suspense boundary" error.
2. **Query parameters, not dynamic segments.** Entity pages are `/lessons/view?id=...`, `/item/?id=...`, read with `nuqs`. `[id]` folders need `generateStaticParams` with build-time data, which we do not have. Only `share` is an exception: nginx serves one shell for `/ai/*` and the page reads `location.pathname`.
3. **No `next/image`** (use `<img>`, `images.unoptimized: true`) and **no `next/font/google`** (use `@fontsource-variable/inter`).
4. **Runtime config from `/env.js`.** One build runs everywhere; `deploy/entrypoint.sh` renders `window.__ENV__` at container start. Read it with `getConfig()` from `@ihsp/config` inside components or hooks, never at module scope. `NEXT_PUBLIC_*` is inlined at build and is only for build facts (version, Bugsink DSN).
5. **No server features:** no middleware, route handlers, server actions, `cookies()`, `headers()`, ISR, or `rewrites`/`redirects`/`headers` in `next.config`.
6. **Browser APIs in effects.** `window`, `localStorage`, `navigator`, `document` only in effects or behind `dynamic(..., { ssr: false })`; client components are prerendered.
7. `trailingSlash: true`; every app has `not-found.tsx`. `basePath` (share uses `/ai`) is not applied to `<img>`, CSS `url()` or `public/` paths.
8. Theme state via `localStorage` and the inline head script; `<html suppressHydrationWarning lang={locale}>`.
9. Tailwind 4 does not scan `node_modules`: register package sources with `@source` in each app's CSS.
10. A new inline script changes the CSP hashes (see the `security` skill).
