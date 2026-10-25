import type { CommonWorkOffChoice, WorkOffChoice, WorkOffItem, WorkOffTemplate } from "@ihsp/api"
import type { Marks } from "./marks"

/**
 * What the teacher chose for one absent student in the form: a template, extra text and a due date. A choice with
 * neither template nor text means "no work-off task" (and removes the saved one on submit).
 */
export type WorkOffDraft = { template_id: string | null; text: string; due_date: string | null }
export type WorkOffDrafts = Record<string, WorkOffDraft>

/** The text a work-off gets: the template text, a blank line, then the extra text; either one alone is enough. */
export function resolveWorkOffText(template: WorkOffTemplate | undefined, extra: string): string {
  return [template?.text.trim() ?? "", extra.trim()].filter(Boolean).join("\n\n")
}

export function draftText(draft: WorkOffDraft, templates: readonly WorkOffTemplate[]): string {
  return resolveWorkOffText(
    templates.find((item) => item.id === draft.template_id),
    draft.text,
  )
}

/** A fresh choice: the teacher's default template preselected, no extra text, no due date. */
export function defaultDraft(templates: readonly WorkOffTemplate[]): WorkOffDraft {
  return { template_id: templates.find((item) => item.is_default)?.id ?? null, text: "", due_date: null }
}

export function workOffOf(items: readonly WorkOffItem[] | undefined, studentId: string): WorkOffItem | undefined {
  return items?.find((item) => item.student_id === studentId)
}

/** Keeps only the choices of students who are still marked absent. */
export function pruneDrafts(drafts: WorkOffDrafts, marks: Marks): WorkOffDrafts {
  return Object.fromEntries(Object.entries(drafts).filter(([studentId]) => marks[studentId] === "absent"))
}

/**
 * The `work_offs` entries of a per-student save: absent students whose choice differs from the saved work-off, and an
 * empty entry for a student whose saved work-off the teacher removed.
 */
export function buildWorkOffEntries(
  drafts: WorkOffDrafts,
  marks: Marks,
  saved: readonly WorkOffItem[] | undefined,
  templates: readonly WorkOffTemplate[],
): WorkOffChoice[] {
  const entries: WorkOffChoice[] = []
  for (const [studentId, draft] of Object.entries(pruneDrafts(drafts, marks))) {
    const text = draftText(draft, templates)
    const existing = workOffOf(saved, studentId)
    if (text === "") {
      if (existing) entries.push({ student_id: studentId, template_id: null, text: null, due_date: null })
    } else if (!existing || existing.text !== text || existing.due_date !== draft.due_date) {
      entries.push({
        student_id: studentId,
        template_id: draft.template_id,
        text: draft.text.trim() || null,
        due_date: draft.due_date,
      })
    }
  }
  return entries
}

export function toCommonWorkOff(draft: WorkOffDraft): CommonWorkOffChoice {
  return { template_id: draft.template_id, text: draft.text.trim() || null, due_date: draft.due_date }
}
