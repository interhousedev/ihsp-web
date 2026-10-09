"use client"

import { NotebookWorkspace, WorkspaceNotFound } from "@ihsp/features-core"
import { useSearchParams } from "next/navigation"

/** `/notebooks/view/?id=`: the workspace of one notebook (static export, so the id is a query parameter). */
export function NotebookPage() {
  const id = useSearchParams().get("id")
  if (!id) return <WorkspaceNotFound />
  return <NotebookWorkspace notebookId={id} />
}
