import type { AssessmentKind, ControlName, ControlPeriod, StaffAssessmentItem } from "@ihsp/api"
import { compareIso } from "@ihsp/i18n"

/** The three controls of a semester, in the order they happen: two midterms and the final. */
export const CONTROLS = ["midterm_1", "midterm_2", "final"] as const satisfies readonly ControlName[]

/** A control week, or `other` for controls that belong to no week (EMIS outside the weeks, one-off tests). */
export type ExamSection = ControlName | "other"

export const SECTIONS: readonly ExamSection[] = [...CONTROLS, "other"]

export type ControlPeriods = Partial<Record<ControlName, ControlPeriod>>

/** What the row shows: a stored date, a date nobody confirmed, or a control week without a date. */
export type ExamStatus = "planned" | "tentative" | "undated"

/** The kind a control week implies: the final is `final`, both midterm weeks are `midterm`. */
export function kindOfControl(control: ControlName): AssessmentKind {
  return control === "final" ? "final" : "midterm"
}

export function sectionOf(item: Pick<StaffAssessmentItem, "control">): ExamSection {
  return item.control ?? "other"
}

export function statusOf(item: Pick<StaffAssessmentItem, "has_date" | "status">): ExamStatus {
  if (!item.has_date) return "undated"
  return item.status === "tentative" ? "tentative" : "planned"
}

/** Dated controls by day and time, then the control weeks still without a date by subject. */
export function compareExams(a: StaffAssessmentItem, b: StaffAssessmentItem): number {
  if (a.has_date !== b.has_date) return a.has_date ? -1 : 1
  if (!a.has_date) return a.subject.name.localeCompare(b.subject.name)
  return (
    compareIso(a.date, b.date) ||
    compareIso(a.starts_at ?? "", b.starts_at ?? "") ||
    a.subject.name.localeCompare(b.subject.name)
  )
}

export type ExamGroup = { section: ExamSection; items: StaffAssessmentItem[] }

/** The controls grouped by control week (Midterm 1, Midterm 2, Final, Other); empty groups are left out. */
export function groupBySection(items: readonly StaffAssessmentItem[]): ExamGroup[] {
  return SECTIONS.map((section) => ({
    section,
    items: items.filter((item) => sectionOf(item) === section).toSorted(compareExams),
  })).filter((group) => group.items.length > 0)
}

/** Only the controls of one subject; an empty id keeps everything. */
export function filterBySubject(items: readonly StaffAssessmentItem[], subjectId: string): StaffAssessmentItem[] {
  return subjectId === "" ? [...items] : items.filter((item) => item.subject.id === subjectId)
}

/** Suggestions to confirm, the most recently created first (EMIS ones without a creation time by date). */
export function newestFirst(items: readonly StaffAssessmentItem[]): StaffAssessmentItem[] {
  return items.toSorted((a, b) => compareIso(b.created_at ?? "", a.created_at ?? "") || compareIso(b.date, a.date))
}

/** The control weeks the list knows about (every item that sits in a week carries it). */
export function weekPeriods(items: readonly StaffAssessmentItem[]): ControlPeriods {
  const periods: ControlPeriods = {}
  for (const item of items) {
    if (item.control && item.period) periods[item.control] = item.period
  }
  return periods
}

/** The control week that contains `date`, if the list knows it. */
export function inferControl(date: string, periods: ControlPeriods): ControlName | null {
  if (date === "") return null
  return (
    CONTROLS.find((control) => {
      const period = periods[control]
      return period !== undefined && period.start <= date && date <= period.end
    }) ?? null
  )
}
