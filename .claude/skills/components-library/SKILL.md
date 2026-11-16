---
name: components-library
description: Use when adding a UI component to packages/ui, or pulling one from the personal library at /Users/aliakseych/Projects/Components; not for app-specific screens.
---

# Components library and packages/ui

## Order of search
1. `packages/ui/src/components` first: reuse before writing anything.
2. The personal library `/Users/aliakseych/Projects/Components` (copy-in React + Tailwind): search `catalog/index.json` (never scan `components/`), read `docs/conventions.md`, use `meta.install` or copy `components/<category>/<slug>/`. Its own `use-component` skill describes the flow.
3. Only then write a new one.

## Adapting a library component
- It lands in `packages/ui/src/components`, not in an app. Replace its `@/lib/utils` and shadcn imports with `../lib/utils` and the existing `ui/` parts (Base UI "base-nova", never `@radix-ui/*`).
- Tokens only (`bg-primary`, `text-muted-foreground`, status and `mark-*` tones); no hex or raw palette classes. Icons through `components/icons.tsx` only. All text arrives as props (no hard-coded strings); the app translates in uz, ru, en.
- No `next/*` imports. Strip demo data and routes. Export from the package index and add a test (behaviour, keyboard, light/dark, 360 px).
- Motion goes through `motion-presence.tsx`: `MotionProvider`, `useMotionReduced()`, `Reveal`, `AnimatedPresence`. Respect reduced motion.

## Primitives to reuse
- `Pill`, `PillStatus`, `PillIndicator`, `PillButton`: small status or filter pills; for statuses and marks prefer `StatusBadge`/`MarkBadge`.
- `GradeChip` (`grade` in `GRADES` E..A, `label`): letter grades.
- `Stepper` (`StepperItem` with `StepStatus` complete/current/upcoming): multi-step flows.
- `ChoiceCard`, `ChoiceCardGroup`: pick one or more big options (cards, not native radios).
- `TagInput` (`value`, `onChange`, `max`, `maxLength`): free-text lists; dedupes ignoring case.
- `SortableList<T extends {id}>`: drag-and-keyboard reordering (priorities, ranked choices).
- `SlideToAgree` (`label`, `doneLabel`, `onAgree`): deliberate consent; see `admission-app`.
- `ResponsiveDialog`, `StateView`, `ListToolbar`, `SaveBar`, `DataTable`: see `ui-ux`.
