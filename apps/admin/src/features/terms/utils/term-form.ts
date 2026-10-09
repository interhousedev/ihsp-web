import type { Bell, ControlName, ControlPeriods, Term, TermInput } from "@ihsp/api"
import { minutesOfDay } from "@ihsp/i18n"
import { CONTROL_NAMES } from "../../shared/utils/controls"

/** One control week while it is edited: both dates empty = not set. */
export type ControlRange = { start: string | null; end: string | null }

export type ControlForm = Record<ControlName, ControlRange>

export type TermForm = {
  academic_year: string
  half: 1 | 2
  starts_on: string | null
  ends_on: string | null
  bells: Bell[]
  non_study_days: string[]
  moved_days: { date: string; follows_weekday: number }[]
  control_periods: ControlForm
}

/** What is wrong with a control week; the same words key the messages `terms.editor.issues.*`. */
export type ControlIssue = "controlIncomplete" | "controlOrder" | "controlOutside" | "controlSequence"

export type TermIssue =
  | "year"
  | "dates"
  | "order"
  | "noBells"
  | "bellTime"
  | "bellWeekdays"
  | "bellDuplicate"
  | ControlIssue

const TIME_PATTERN = /^\d{2}:\d{2}$/

const NO_RANGE: ControlRange = { start: null, end: null }

export function emptyControlForm(): ControlForm {
  return { midterm_1: { ...NO_RANGE }, midterm_2: { ...NO_RANGE }, final: { ...NO_RANGE } }
}

export function emptyTermForm(template?: Term): TermForm {
  return {
    academic_year: "",
    half: 1,
    starts_on: null,
    ends_on: null,
    // A new term starts from the template's times, which Administration now owns: copies are by hand, even when the
    // template's bells came from EMIS (the sync replaces the periods EMIS lists once the term is current).
    bells: template
      ? template.bells.map((bell) => ({ ...bell, weekdays: [...bell.weekdays], source: "manual" as const }))
      : [],
    non_study_days: [],
    moved_days: [],
    // The weeks differ every term, so they are never copied from the template.
    control_periods: emptyControlForm(),
  }
}

export function termToForm(term: Term): TermForm {
  return {
    academic_year: term.academic_year,
    half: term.half,
    starts_on: term.starts_on,
    ends_on: term.ends_on,
    bells: term.bells.map((bell) => ({ ...bell, weekdays: [...bell.weekdays] })),
    non_study_days: [...term.non_study_days],
    moved_days: term.moved_days.map((day) => ({ ...day })),
    control_periods: {
      midterm_1: { ...(term.control_periods.midterm_1 ?? NO_RANGE) },
      midterm_2: { ...(term.control_periods.midterm_2 ?? NO_RANGE) },
      final: { ...(term.control_periods.final ?? NO_RANGE) },
    },
  }
}

/**
 * The problem of each control week, mirroring the backend rule: both dates, start on or before end, inside the term,
 * and starting after the end of the previous week that is set. Only the first problem of a week is reported.
 */
export function controlIssues(form: TermForm): Partial<Record<ControlName, ControlIssue>> {
  const found: Partial<Record<ControlName, ControlIssue>> = {}
  let previousEnd: string | null = null
  for (const name of CONTROL_NAMES) {
    const { start, end } = form.control_periods[name]
    if (start === null && end === null) continue
    if (start === null || end === null) {
      found[name] = "controlIncomplete"
      continue
    }
    // A term whose own dates are wrong gets that one message, not a second one for every week.
    const termDates = form.starts_on !== null && form.ends_on !== null && form.starts_on < form.ends_on
    const outside = termDates && (start < (form.starts_on ?? "") || end > (form.ends_on ?? ""))
    if (start > end) found[name] = "controlOrder"
    else if (outside) found[name] = "controlOutside"
    else if (previousEnd !== null && start <= previousEnd) found[name] = "controlSequence"
    previousEnd = end
  }
  return found
}

/** The weeks that are fully set, as the API wants them (a week not set is left out). */
function controlPeriodsOf(form: TermForm): ControlPeriods {
  const periods: ControlPeriods = {}
  for (const name of CONTROL_NAMES) {
    const { start, end } = form.control_periods[name]
    if (start !== null && end !== null) periods[name] = { start, end }
  }
  return periods
}

function sameControlPeriods(a: ControlPeriods, b: ControlPeriods): boolean {
  return CONTROL_NAMES.every((name) => {
    const left = a[name]
    const right = b[name]
    if (!left || !right) return !left && !right
    return left.start === right.start && left.end === right.end
  })
}

/** Everything that stops the form from being saved (the server checks overlaps with other terms). */
export function validateTerm(form: TermForm): TermIssue[] {
  const issues: TermIssue[] = []
  if (form.academic_year.trim() === "") issues.push("year")
  if (!form.starts_on || !form.ends_on) issues.push("dates")
  else if (form.starts_on >= form.ends_on) issues.push("order")
  if (form.bells.length === 0) issues.push("noBells")
  const seen = new Set<string>()
  let duplicate = false
  for (const bell of form.bells) {
    if (
      !TIME_PATTERN.test(bell.start) ||
      !TIME_PATTERN.test(bell.end) ||
      minutesOfDay(bell.start) >= minutesOfDay(bell.end)
    ) {
      if (!issues.includes("bellTime")) issues.push("bellTime")
    }
    if (bell.weekdays.length === 0 && !issues.includes("bellWeekdays")) issues.push("bellWeekdays")
    for (const weekday of bell.weekdays) {
      const key = `${bell.period}:${weekday}`
      if (seen.has(key)) duplicate = true
      seen.add(key)
    }
  }
  if (duplicate) issues.push("bellDuplicate")
  for (const issue of new Set(Object.values(controlIssues(form)))) issues.push(issue)
  return issues
}

/**
 * The request body; only call it when `validateTerm` returned no issues. The control weeks are sent when the term is
 * new (`original` missing) or when they differ from `original`: on PATCH the object replaces the stored weeks, and
 * leaving it out keeps them.
 */
export function termInput(form: TermForm, original?: Term): TermInput {
  const input: TermInput = {
    academic_year: form.academic_year.trim(),
    half: form.half,
    starts_on: form.starts_on ?? "",
    ends_on: form.ends_on ?? "",
    bells: [...form.bells].toSorted((a, b) => a.period - b.period || (a.weekdays[0] ?? 0) - (b.weekdays[0] ?? 0)),
    non_study_days: [...new Set(form.non_study_days)].toSorted(),
    moved_days: [...form.moved_days].toSorted((a, b) => a.date.localeCompare(b.date)),
  }
  const periods = controlPeriodsOf(form)
  if (!original || !sameControlPeriods(periods, original.control_periods)) input.control_periods = periods
  return input
}
