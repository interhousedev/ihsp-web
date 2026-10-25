---
name: openui
description: Use when changing how AI answers render structured UI (packages/features-core/src/openui) - the component catalogue shared with the backend, safe rendering, and responsive layouts of generated blocks.
---

# OpenUI rendering

The assistant and notebooks can answer with an ```` ```openui ```` fenced block. The web renders it with `@openuidev/react-lang` through a fixed component library.

## Catalogue sync
- `packages/features-core/src/openui/catalog.json` must be byte-identical to `iht-backend/app/shared/openui/catalog.json`. `catalog.test.ts` checks it when the backend checkout exists (`IHSP_BACKEND_DIR` or `../iht-backend`).
- Change the catalogue in the backend first (it builds the model prompt and validates output), copy it here, then implement the component in `library.tsx`. The fence is `openui`, the root is `Stack`.

## Safety
- Only components in the catalogue render; unknown nodes are dropped.
- All strings go through `str()` and lists through `clamp()` from `safe.ts` (catalogue limits); links through `safeHttpsUrl()`.
- No raw HTML, no `dangerouslySetInnerHTML`, no scripts or iframes.
- `split.ts` separates markdown from openui fences; partial blocks while streaming must not crash (`split.test.ts`).

## Responsive layout
- Blocks render inside a chat column that is 320 px wide on phones. Rows wrap to a column below 768 px, grids collapse to one column, tables become cards, charts (`charts.tsx`) keep a fixed aspect ratio and full width.
- `responsive.test.tsx` covers this; add a case for every new layout component. Use only `@ihsp/ui` tokens so dark mode works.
