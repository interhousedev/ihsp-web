"use client"

import { NotebookWorkspace, WorkspaceNotFound } from "@ihsp/features-core"
import { useSearchParams } from "next/navigation"

/** `/notebooks/view/?id=`: the workspace of one of the student's course notebooks (features-core screens). */
export function CourseNotebookPage() {
  const id = useSearchParams().get("id")
  if (!id) return <WorkspaceNotFound />
  return <NotebookWorkspace notebookId={id} />
}
