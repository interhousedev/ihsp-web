"use client"

import { NotebookWorkspace, WorkspaceNotFound } from "@ihsp/features-core"
import { useSearchParams } from "next/navigation"
import { AttachToLesson } from "./attach-to-lesson"

/**
 * `/notebooks/view/?id=`: the workspace of one notebook (static export, so the id is a query parameter). While a
 * Studio output is open (`&artifact=`) a teacher can attach it to a lesson.
 */
export function NotebookPage() {
  const params = useSearchParams()
  const id = params.get("id")
  const artifactId = params.get("artifact")
  if (!id) return <WorkspaceNotFound />
  return (
    <>
      <NotebookWorkspace notebookId={id} />
      {artifactId ? <AttachToLesson notebookId={id} artifactId={artifactId} /> : null}
    </>
  )
}
