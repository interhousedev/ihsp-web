import type { Anchor } from "@ihsp/api"

/** The three areas of a notebook; on a phone they are tabs (`?tab=`). */
export type WorkspaceTab = "sources" | "chat" | "studio"

/** A question a pane (source viewer, mind map, ...) asks the notebook chat on behalf of the student. */
export type AskRequest = {
  text: string
  /** Passages or text the question is about (sent as `anchor`). */
  anchor?: Anchor
  /** Restrict the answer to these sources; default is the current selection. */
  sourceIds?: string[]
}
