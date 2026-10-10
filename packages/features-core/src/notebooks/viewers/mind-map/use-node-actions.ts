"use client"

import type { MindMapNode, RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useCallback } from "react"
import { citationsFromRefs } from "../../chat/ref-chips"
import { useWorkspace } from "../../workspace-context"
import { useSharedViewer } from "../shared-viewer"

/**
 * What the student can do with a node besides reading it: ask the chat about it (the question carries the node's
 * passages as an anchor) and open its first source. Refs whose label is not in `refs_index` are skipped.
 */
export function useNodeActions(refsIndex: RefsIndex) {
  const t = useT("notebooks")
  const workspace = useWorkspace()
  const shared = useSharedViewer()

  const hasSources = useCallback(
    (node: MindMapNode) => !shared && citationsFromRefs(node.refs, refsIndex).length > 0,
    [refsIndex, shared],
  )

  const askAbout = useCallback(
    (node: MindMapNode) => {
      const ids = citationsFromRefs(node.refs, refsIndex).map((citation) => citation.passage_id)
      workspace.ask({
        text: t("mindmap.prompt", { label: node.label }),
        ...(ids.length > 0 ? { anchor: { kind: "passages" as const, ids } } : {}),
      })
    },
    [refsIndex, workspace, t],
  )

  const showSources = useCallback(
    (node: MindMapNode) => {
      const first = citationsFromRefs(node.refs, refsIndex)[0]
      if (first) workspace.openSource(first.source_id, first.passage_id)
    },
    [refsIndex, workspace],
  )

  return { hasSources, askAbout, showSources, shared }
}
