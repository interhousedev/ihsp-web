"use client"

import type { ArtifactDetail } from "@ihsp/api"
import { ApplyButton } from "./apply-button"
import { useCourseContext } from "./use-course-context"

/**
 * The strip above a quiz or flash cards viewer in a course workspace with "Apply to course step" (their test or card
 * block is appended to the step the author picks). Nothing is shown in a student's notebook or to readers.
 */
export function ApplyBar({ notebookId, artifact }: { notebookId: string; artifact: ArtifactDetail }) {
  const { courseId, canWrite } = useCourseContext(notebookId)
  if (courseId === null || !canWrite) return null
  if (artifact.kind !== "quiz" && artifact.kind !== "flashcards") return null
  return (
    <div className="flex shrink-0 justify-end border-b px-4 py-2 print:hidden">
      <ApplyButton notebookId={notebookId} artifact={{ id: artifact.id, kind: artifact.kind, title: artifact.title }} />
    </div>
  )
}
