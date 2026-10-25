import type { NotebookItem } from "@ihsp/api"

/**
 * The three folders notebooks are grouped into: subject (and other automatic) notebooks, LMS course notebooks (the
 * course's own and each student's copy of it), the user's own.
 */
export type NotebookFolder = "subject" | "course" | "mine"

export const NOTEBOOK_FOLDERS: readonly NotebookFolder[] = ["subject", "course", "mine"]

export function notebookFolderOf(notebook: Pick<NotebookItem, "origin">): NotebookFolder {
  if (notebook.origin === "course" || notebook.origin === "course_student") return "course"
  if (notebook.origin === "subject_auto" || notebook.origin === "lesson_auto") return "subject"
  return "mine"
}

export function parseNotebookFolder(value: string | null | undefined): NotebookFolder | null {
  return NOTEBOOK_FOLDERS.find((folder) => folder === value) ?? null
}

export function groupNotebooks<T extends Pick<NotebookItem, "origin">>(
  items: readonly T[],
): Record<NotebookFolder, T[]> {
  const groups: Record<NotebookFolder, T[]> = { subject: [], course: [], mine: [] }
  for (const item of items) groups[notebookFolderOf(item)].push(item)
  return groups
}
