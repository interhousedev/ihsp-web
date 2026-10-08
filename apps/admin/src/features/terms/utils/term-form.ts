import type { Bell, Term, TermInput } from "@ihsp/api"
import { minutesOfDay } from "@ihsp/i18n"

export type TermForm = {
  academic_year: string
  half: 1 | 2
  starts_on: string | null
  ends_on: string | null
  bells: Bell[]
  non_study_days: string[]
  moved_days: { date: string; follows_weekday: number }[]
}

export type TermIssue = "year" | "dates" | "order" | "noBells" | "bellTime" | "bellWeekdays" | "bellDuplicate"

const TIME_PATTERN = /^\d{2}:\d{2}$/

export function emptyTermForm(template?: Term): TermForm {
  return {
    academic_year: "",
    half: 1,
    starts_on: null,
    ends_on: null,
    bells: template ? template.bells.map((bell) => ({ ...bell, weekdays: [...bell.weekdays] })) : [],
    non_study_days: [],
    moved_days: [],
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
  }
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
  return issues
}

/** The request body; only call it when `validateTerm` returned no issues. */
export function termInput(form: TermForm): TermInput {
  return {
    academic_year: form.academic_year.trim(),
    half: form.half,
    starts_on: form.starts_on ?? "",
    ends_on: form.ends_on ?? "",
    bells: [...form.bells].toSorted((a, b) => a.period - b.period || (a.weekdays[0] ?? 0) - (b.weekdays[0] ?? 0)),
    non_study_days: [...new Set(form.non_study_days)].toSorted(),
    moved_days: [...form.moved_days].toSorted((a, b) => a.date.localeCompare(b.date)),
  }
}
