import type { Block, StepContent } from "@ihsp/api"

export type DiffStatus = "same" | "added" | "removed" | "changed"

export type BlockDiffRow = { id: string; status: DiffStatus; live: Block | null; draft: Block | null }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Structural equality of JSON values; key order does not matter. */
export function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((item, index) => jsonEqual(item, b[index]))
  if (isRecord(a) && isRecord(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of keys) {
      if (!jsonEqual(a[key], b[key])) return false
    }
    return true
  }
  return false
}

/**
 * Pairs the blocks of the live content with those of the draft by id. Rows follow the draft order; blocks that only
 * exist live ("removed") are placed after the row of their live predecessor.
 */
export function diffBlocks(live: StepContent | null, draft: StepContent): BlockDiffRow[] {
  const liveBlocks = live?.blocks ?? []
  const liveById = new Map(liveBlocks.map((block) => [block.id, block]))
  const draftIds = new Set(draft.blocks.map((block) => block.id))

  const rows: BlockDiffRow[] = draft.blocks.map((block) => {
    const before = liveById.get(block.id) ?? null
    const status: DiffStatus = before === null ? "added" : jsonEqual(before, block) ? "same" : "changed"
    return { id: block.id, status, live: before, draft: block }
  })

  liveBlocks.forEach((block, index) => {
    if (draftIds.has(block.id)) return
    let anchor = -1
    for (let back = index - 1; back >= 0; back -= 1) {
      const previous = liveBlocks[back]
      const found = previous ? rows.findIndex((row) => row.id === previous.id) : -1
      if (found >= 0) {
        anchor = found
        break
      }
    }
    rows.splice(anchor + 1, 0, { id: block.id, status: "removed", live: block, draft: null })
  })

  return rows
}

/** True when anything differs between the live and the draft content (title or blocks). */
export function hasContentChanges(live: StepContent | null, draft: StepContent): boolean {
  if (live === null) return true
  return live.title !== draft.title || diffBlocks(live, draft).some((row) => row.status !== "same")
}
