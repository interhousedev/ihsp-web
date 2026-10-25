"use client"

import type { MindMapNode, RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { RefChips } from "../../chat/ref-chips"
import { MindMapEditActions, type NodeEditHandlers } from "./mind-map-edit-actions"
import { MindMapNodeActions } from "./mind-map-node-actions"

type MindMapDetailsBodyProps = {
  node: MindMapNode
  refsIndex: RefsIndex
  /** `null` for a leaf; otherwise whether the branch is open. */
  expanded: boolean | null
  onToggle: () => void
  onAsked: () => void
  edit?: NodeEditHandlers
}

/** The note, source chips and actions of one node (the same in the popover card and the phone sheet). */
export function MindMapDetailsBody({ node, refsIndex, expanded, onToggle, onAsked, edit }: MindMapDetailsBodyProps) {
  const t = useT("notebooks")
  return (
    <>
      {node.note ? <p className="text-muted-foreground text-sm break-words">{node.note}</p> : null}
      <RefChips refs={node.refs} refsIndex={refsIndex} />
      <MindMapNodeActions node={node} refsIndex={refsIndex} onAsked={onAsked}>
        {expanded !== null ? (
          <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={onToggle}>
            {expanded ? t("mindmap.collapse") : t("mindmap.expand")}
          </Button>
        ) : null}
      </MindMapNodeActions>
      {edit ? <MindMapEditActions {...edit} /> : null}
    </>
  )
}
