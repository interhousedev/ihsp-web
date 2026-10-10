import type { BookForm } from "./book-form"

/** A message of `library.manage.editor.error` with its values. */
export type FormIssue = { key: string; values?: Record<string, string | number> }
export type FormIssues = Partial<Record<"title" | "authors" | "yearPublished" | "topics", FormIssue>>

const YEAR = /^\d{1,4}$/

/** Problems the form can see by itself, before the API is asked (Save and Publish stay off while there are any). */
export function validateForm(form: BookForm): FormIssues {
  const issues: FormIssues = {}
  if (!form.title.trim()) issues.title = { key: "titleRequired" }
  if (form.authors.length === 0) issues.authors = { key: "authorsRequired" }
  if (form.yearPublished.trim() && !YEAR.test(form.yearPublished.trim())) issues.yearPublished = { key: "yearInvalid" }

  const badRange = form.topics.some((row) => {
    const from = Number(row.page_from)
    const to = Number(row.page_to)
    return row.page_from.trim() !== "" && row.page_to.trim() !== "" && from > to
  })
  if (badRange) issues.topics = { key: "rangeInvalid" }
  return issues
}

export type ChecklistItem = { key: string; ok: boolean }

/** The publish checklist of computed from the form, for a new or edited book the API has not seen yet. */
export function localChecklist(form: BookForm, file: { present: boolean; textOk: boolean }): ChecklistItem[] {
  return [
    { key: "text_status", ok: file.present && file.textOk },
    { key: "cover", ok: form.coverFileId !== null },
    { key: "subjects", ok: form.subjects.length > 0 },
  ]
}
