"use client"

import { useLoadedNotebook } from "../../api/use-notebooks"

/** The course a notebook is the workspace of, and whether the user may change it. Both null/false for a student's notebook. */
export function useCourseContext(notebookId: string): { courseId: string | null; canWrite: boolean } {
  const notebook = useLoadedNotebook(notebookId)
  const courseId = notebook.data?.course_id ?? null
  return { courseId, canWrite: courseId !== null && notebook.data?.can_write !== false }
}

/** Where "Open in editor" goes after Apply: the step that was written, else the course outline. */
export function editorHrefFor(courseId: string, stepId: string | null): string {
  return stepId ? `/edit/step/?id=${stepId}` : `/edit/?id=${courseId}`
}
