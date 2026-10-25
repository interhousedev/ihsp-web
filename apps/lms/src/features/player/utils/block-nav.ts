import type { StepView } from "@ihsp/api"
import type { OutlineSection } from "@ihsp/api"
import { neighbours } from "../../shared/utils/outline"

type Blocks = StepView["blocks"]

/** Where a "Previous" or "Next step" button leads: a step (block) of this lesson or another lesson. */
export type NavTarget =
  | { kind: "step"; stepId: string; block: number }
  | { kind: "lesson"; stepId: string; block: number | null }

/** The 0-based index of the first step (block) not passed yet; the first one when everything is passed. */
export function firstOpenBlock(blocks: Blocks): number {
  const index = blocks.findIndex((block) => !block.passed)
  return index === -1 ? 0 : index
}

/** Keeps a `block` number from the address (1-based) inside the lesson; `null` means "the first step not passed". */
export function resolveBlock(requested: number | null, blocks: Blocks, fallback: number | null): number {
  if (blocks.length === 0) return 0
  const index = requested === null ? (fallback ?? firstOpenBlock(blocks)) : requested - 1
  return Math.min(Math.max(index, 0), blocks.length - 1)
}

/**
 * The buttons under a step: inside the lesson they walk the steps, at its ends they lead to the neighbour lessons
 * (the previous lesson opens at its first step, the next lesson at the first step not passed yet). `null` means there is
 * nowhere to go.
 */
export function blockTargets({
  stepId,
  index,
  total,
  outline,
}: {
  stepId: string
  index: number
  total: number
  outline: readonly OutlineSection[] | null
}): { previous: NavTarget | null; next: NavTarget | null } {
  const around = outline ? neighbours(outline, stepId) : null
  const previous: NavTarget | null =
    index > 0
      ? { kind: "step", stepId, block: index }
      : around?.previous
        ? { kind: "lesson", stepId: around.previous.step_id, block: 1 }
        : null
  const next: NavTarget | null =
    index < total - 1
      ? { kind: "step", stepId, block: index + 2 }
      : around?.next
        ? { kind: "lesson", stepId: around.next.step_id, block: null }
        : null
  return { previous, next }
}
