---
name: ui-ux
description: Use when building or changing any screen in apps/* or packages/ui - layout, responsive behaviour, tables, touch targets, theme tokens, copy on the page, or the Telegram mini app webview.
---

# UI and UX in iht-web

Students mostly use phones, often inside the Telegram webview. Design for that first.

## Tables
- **Student, staff, LMS and library tables are cards below 768 px:** `DataTable` with `cardLayout` for paged data, `ResponsiveTable` from `@ihsp/ui` for static rows. Two or three narrow columns that fit at 360 px may stay a table.
- **Only the journal and timetable grids scroll sideways.** Content tables (Markdown, slides) scroll inside their own frame.
- **Admin** need not meet the phone standard but must not overflow the page: use the `Table` components, never a raw `<table>` (a test enforces it).

## Forms and loading
- Long forms end in `SaveBar` from `@ihsp/ui`: dirty indicator, Save, Discard, safe-area and bottom-nav offset, and `useUnsavedGuard`.
- One spinner: `Spinner`, and `LoadingButton` for a button (a test enforces it).

## Layout
- **Mobile first at 360 px.** Build the 360 px layout, then widen. Check 360, 768 and 1280 px.
- **Touch targets at least 44 px** (icon buttons included). Phones get the bottom bar; desktop gets the sidebar.
- **One overflow menu on phones.** When an app passes `bottomNav` or `bottomBar` to `AppShell`, the sidebar toggle is hidden under 768 px and the bottom bar's "More" sheet holds every other destination and a platforms section for moving between apps. "More" lights up when the current page has no tab, so one slot is always active. The id app has a bottom bar too; admin has none.
- **One name, one icon.** A destination uses the same icon in every app, and two destinations in one app never share an icon. `packages/ui/src/__tests__/nav-routes.test.ts` checks this, label parity and that every nav link is a route. Staff keep "Контроли" / "Nazoratlar" on purpose: that page covers ПК and ИК.
- **Dialogs through `ResponsiveDialog`** (sizes `sm`, `md`, `lg`): a dialog on a desktop, a keyboard-aware bottom sheet on a phone. Small destructive confirmations stay `ConfirmDialog`; layouts with their own frame (cropper, drive picker) may stay `Dialog`.
- **List filters through `ListToolbar`**, with active-filter chips and a reset; `SubjectFilter` for a subject choice. No native `<select>`: use `Select`. There are currently no exceptions; add one here only when a form control on phones genuinely needs the native picker.
- **Page titles through `PageContainer`/`PageHeader`** (title, back link, actions); never a hand-written `<h1>`. Empty, loading and error states through `StateView`.
- **Header facts go in `meta`, status in `badge`** on `PageContainer`/`PageHeader`; there is no `description`.
- **Page-level states use `StateView`** (or `QueryState`): `state="filtered"` with `onReset` when search or filters hide everything, and the `skeleton` slot (`CardSkeletons`) for a loading shape. A small section inside a card keeps its short muted line. A `Suspense` fallback uses the same skeleton as the loaded state.
- Respect safe areas (`env(safe-area-inset-*)`) and never put actions under the home indicator.

## Components and tokens
- **Only `packages/ui`.** shadcn/ui `base-nova` on Base UI. Never install `@radix-ui/*`, never paste "new-york" snippets, never write one-off buttons or inputs in an app.
- **Icons only from the registry** `packages/ui/src/components/icons.tsx` (a test enforces it).
- **Colours only through tokens** (`bg-background`, `text-muted-foreground`, `bg-primary` ...) from `packages/ui/src/styles/theme.css`. Every screen must work in light and dark; never hard-code hex colours.
- **Status colours by meaning:** `success`, `warning`, `info`, `destructive` (each with `-foreground` and `-muted`) and the grade scale `mark-5`..`mark-2`. Use `StatusBadge`, `Badge` tones and `MarkBadge` rather than hand-built pills. Raw Tailwind palette classes (`text-green-600`, `bg-amber-100` ...) fail `packages/ui/src/__tests__/palette-colors.test.ts`; its allowlist only shrinks (decorative category colours such as reader highlights stay listed).
- Cards use `rounded-card`; `Button shape="pill"` for prominent page actions. The landing brand blue is `--brand` in `packages/ui/src/styles/brand.css`.
- `@ihsp/ui` must not import `next/navigation`; pass `pathname` and a link component as props.

## Copy
- **No page subtitles** or descriptions under page titles; no dialog descriptions that repeat the title; no hints that state the obvious.
- Keep one-line hints that prevent mistakes (the 7-day journal edit window, an activation link shown once, Tashkent time).
- All text in uz, ru and en (see the `i18n` skill). Keep the user's draft on expected failures (429, 503).

## Telegram mini app
- `sp`, `staff`, `lms` and `library` can open as the mini app with a bridge loaded only inside Telegram (`LazyTelegramBridge` in lms and library); use `packages/telegram` for theme colours, safe areas and the back button.
- Telegram's native Back replaces the shell's history buttons, so there is never a double back. A page's `BackLink` takes priority over the shell fallback, which goes home after a deep link with no history.
- Mini app sessions never reach the admin app. Avoid hover-only affordances and `window.open` popups; links leave through the Telegram SDK.

## Accessibility
Keyboard operable, visible focus, labelled controls, correct roles. The e2e tests run axe; fix violations, do not suppress them.

## Visual gate
Every UI change follows skill://ui-craft Verify loop (global skill). If it is unavailable: (1) start the app locally; (2) screenshot the changed screens at 360, 768 and 1280 px, light and dark; (3) open the images and fix blank blocks, overflow, overlaps, raw keys; (4) repeat until clean.
The gate covers every app whose shared shell or `packages/ui` you touched, not only the edited page.

## Artifact rules
- Never use `bg-primary`/`bg-foreground` as a large surface in the mono theme: it renders as a black/white slab.
- App shell headers render the signed-in user's avatar and display name at every breakpoint; a header showing only an empty bar is a defect.
- University logos are `object-contain` with padding; never crop.
- Never show raw tag or i18n keys: map `major:*` and similar through i18n.
- Fixed or floating elements never sit inside transformed wrappers (`.page-enter`).
- Floating toolbars reserve header space.
- Inputs are at least 16px on mobile (iOS zoom).
- Fixed-height lists use an edge fade, not visible scrollbars.
- Gantt/timeline bars always carry a label and a non-black fill.

## Brand assets
The lyceum crest SVG in the repo is the default; tenants/admins can override logos via config — never hardcode a logo path in components. PWA icons are generated from the crest. No per-app glyph "logos".
