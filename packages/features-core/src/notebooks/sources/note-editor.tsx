"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton, StateView } from "@ihsp/ui"
import { useWorkspace } from "../workspace-context"
import { NoteForm } from "./note-form"
import { useSourceDetail } from "./use-source-detail"

export type NoteEditorProps = {
  notebookId: string
  /** Edits this `note` / `text` source; absent creates a new note. */
  sourceId?: string | null
}

/**
 * The note editor (middle pane / full screen): a title and a Markdown field. Without `sourceId` it writes a new note
 * (`kind: "note"`); with one it edits a pasted text or note. A saved chat answer keeps its citations: it is shown
 * read-only until the student chooses "Remove citations and edit".
 */
export function NoteEditor({ notebookId, sourceId = null }: NoteEditorProps) {
  const t = useT("notebooks")
  const { closeViewer } = useWorkspace()
  const detail = useSourceDetail(notebookId, sourceId)

  if (sourceId === null) return <NoteForm notebookId={notebookId} source={null} onClose={closeViewer} />
  if (detail.isPending) {
    return (
      <div role="status" aria-busy="true" aria-label={t("viewer.loadingText")} className="flex flex-col gap-3 p-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (detail.isError) {
    return (
      <div className="p-4">
        <StateView state="error" error={detail.error} onRetry={() => void detail.refetch()} />
      </div>
    )
  }
  return <NoteForm key={detail.data.id} notebookId={notebookId} source={detail.data} onClose={closeViewer} />
}
