import type { Anchor, RefsIndex } from "@ihsp/api"

/**
 * The chat anchor for an item that has `refs` labels (`"S1:P4"`): the ids of the passages they point to, resolved
 * through the artifact's `refs_index`. `undefined` when none of the labels resolves (the chat then uses the selection).
 */
export function anchorFromRefs(refs: readonly string[], index: RefsIndex): Anchor | undefined {
  const ids = [...new Set(refs.map((label) => index[label]?.passage_id).filter((id): id is string => !!id))]
  return ids.length > 0 ? { kind: "passages", ids } : undefined
}
