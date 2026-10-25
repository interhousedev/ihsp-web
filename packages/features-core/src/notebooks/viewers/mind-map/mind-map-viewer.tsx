"use client"

import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import type { ViewerProps } from "../viewer-props"
import { MindMapBoard } from "./mind-map-board"

/**
 * Interactive mind map of a Studio artifact: a pannable and zoomable horizontal tree (root left), branches coloured per
 * first-level concept, expand/collapse, a details card per node with **Ask in chat** and **Show sources**, and an
 * outline view as the accessible alternative. Editable: nodes drag anywhere, children, siblings and free text blocks
 * can be added, labels edited and nodes deleted; «Сжать» goes back to the automatic layout. The changes are saved
 * in `progress_state` of the artifact. The header (Back, title, menu) is rendered by `ArtifactViewer`.
 */
export function MindMapViewer({ notebookId, artifact }: ViewerProps<"mind_map">) {
  const t = useT("notebooks")
  const content = artifact.content
  if (!content || content.nodes.length === 0) {
    return <StateView state="empty" emptyText={t("mindmap.empty")} className="m-4" />
  }
  return (
    <MindMapBoard
      key={artifact.id}
      notebookId={notebookId}
      artifactId={artifact.id}
      content={content}
      refsIndex={artifact.refs_index}
      saved={artifact.progress_state}
    />
  )
}
