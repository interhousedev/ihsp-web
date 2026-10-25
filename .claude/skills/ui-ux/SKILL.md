---
name: ui-ux
description: Use when building or changing any screen in apps/* or packages/ui - layout, responsive behaviour, tables, touch targets, theme tokens, copy on the page, or the Telegram mini app webview.
---

# UI and UX in iht-web

Students mostly use phones, often inside the Telegram webview. Design for that first.

## Layout
- **Mobile first at 360 px.** Build the 360 px layout, then widen. Check 360, 768 and 1280 px.
- **Tables become cards below 768 px.** Use the data table from `@ihsp/ui`, which switches to a card list; never ship a horizontally scrolling table on phones.
- **Touch targets at least 44 px** (icon buttons included). Phones get the bottom bar; desktop gets the sidebar.
- Respect safe areas (`env(safe-area-inset-*)`) and never put actions under the home indicator.

## Components and tokens
- **Only `packages/ui`.** shadcn/ui `base-nova` on Base UI. Never install `@radix-ui/*`, never paste "new-york" snippets, never write one-off buttons or inputs in an app.
- **Icons only from the registry** `packages/ui/src/components/icons.tsx` (a test enforces it).
- **Colours only through tokens** (`bg-background`, `text-muted-foreground`, `bg-primary` ...) from `packages/ui/src/styles/theme.css`. Every screen must work in light and dark; never hard-code hex colours. The landing brand blue is `--brand` in `apps/landing/src/app/landing.css`.
- `@ihsp/ui` must not import `next/navigation`; pass `pathname` and a link component as props.

## Copy
- **No page subtitles** or descriptions under page titles; no dialog descriptions that repeat the title; no hints that state the obvious.
- Keep one-line hints that prevent mistakes (the 7-day journal edit window, an activation link shown once, Tashkent time).
- All text in uz, ru and en (see the `i18n` skill). Keep the user's draft on expected failures (429, 503).

## Telegram mini app
- `sp` runs as the mini app; use `packages/telegram` for theme colours, back button and safe areas.
- Mini app sessions never reach the admin app. Avoid hover-only affordances and `window.open` popups; links leave through the Telegram SDK.

## Accessibility
Keyboard operable, visible focus, labelled controls, correct roles. The e2e tests run axe; fix violations, do not suppress them.
