"use client"

import { isApiError } from "@ihsp/api"
import { StateView } from "@ihsp/ui"
import { useNotebook } from "../api"
import { LoadedWorkspace } from "./loaded-workspace"
import { useWorkspaceLayout } from "./use-workspace-layout"
import { WorkspaceNotFound } from "./workspace-not-found"
import { WorkspaceSkeleton } from "./workspace-skeleton"

export type NotebookWorkspaceProps = {
  notebookId: string
  /** Where the "not found" page leads back to (a course workspace is opened from the course editor). */
  notFoundHref?: string
}

/**
 * The notebook page: header, then Sources, Chat and Studio as three resizable
 * panes (from 1280 px), the chat with side sheets (768 to 1279 px) or three tabs (phone). A source, an artifact or the
 * note editor replaces the chat while open. State that deserves a link (`tab`, `source`, `passage`, `artifact`, `note`,
 * `add`) lives in the address.
 */
export function NotebookWorkspace({ notebookId, notFoundHref }: NotebookWorkspaceProps) {
  const notebook = useNotebook(notebookId)
  const layout = useWorkspaceLayout()

  if (notebook.isPending) return <WorkspaceSkeleton layout={layout} />
  if (notebook.isError) {
    if (isApiError(notebook.error) && notebook.error.status === 404)
      return <WorkspaceNotFound {...(notFoundHref ? { backHref: notFoundHref } : {})} />
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-4">
        <StateView state="error" error={notebook.error} onRetry={() => void notebook.refetch()} />
      </div>
    )
  }
  return <LoadedWorkspace key={notebook.data.id} notebook={notebook.data} layout={layout} />
}
