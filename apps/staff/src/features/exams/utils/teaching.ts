import type { GroupItem, LessonItem, StaffAssessmentItem } from "@ihsp/api"
import { addDays, startOfWeek } from "@ihsp/i18n"
import type { ExamFormValues } from "./exam-form"
import { subgroupValue } from "./exam-form"

export type TeachingGroup = { id: string; name: string }

/** A subject the teacher can set a control for in a group; `subgroup` is the half the teacher teaches (if only one). */
export type SubjectChoice = { id: string; name: string; subgroup: ExamFormValues["subgroup"] }

/** Eight weeks from this Monday: both week parities and the next control weeks. */
const TIMETABLE_WEEKS = 8

/** `from` and `to` of the timetable the groups and subjects are read from. */
export function teachingRange(today: string): { from: string; to: string } {
  const from = startOfWeek(today)
  return { from, to: addDays(from, TIMETABLE_WEEKS * 7 - 1) }
}

function byName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name, undefined, { numeric: true })
}

/** The groups the teacher curates and the groups they teach in the next weeks, each once, by name. */
export function teachingGroups(curated: readonly GroupItem[], lessons: readonly LessonItem[]): TeachingGroup[] {
  const groups = new Map<string, TeachingGroup>()
  for (const group of curated) groups.set(group.id, { id: group.id, name: group.name })
  for (const lesson of lessons) {
    for (const entry of lesson.audience) {
      if (!groups.has(entry.group_id)) groups.set(entry.group_id, { id: entry.group_id, name: entry.group_name })
    }
  }
  return [...groups.values()].toSorted(byName)
}

/**
 * The subjects of a group the teacher can plan a control for: those they teach there (timetable) and those that
 * already have a control in the list, by name. A subject taught in one subgroup only comes with that subgroup.
 */
export function subjectChoices(
  lessons: readonly LessonItem[],
  groupId: string,
  items: readonly StaffAssessmentItem[],
): SubjectChoice[] {
  const choices = new Map<string, SubjectChoice>()
  const halves = new Map<string, Set<ExamFormValues["subgroup"]>>()
  for (const lesson of lessons) {
    for (const entry of lesson.audience) {
      if (entry.group_id !== groupId) continue
      choices.set(lesson.subject.id, { id: lesson.subject.id, name: lesson.subject.name, subgroup: "" })
      const set = halves.get(lesson.subject.id) ?? new Set()
      set.add(subgroupValue(entry.subgroup))
      halves.set(lesson.subject.id, set)
    }
  }
  for (const [id, set] of halves) {
    const only = set.size === 1 ? [...set][0] : ""
    const choice = choices.get(id)
    if (choice) choice.subgroup = only ?? ""
  }
  for (const item of items) {
    if (!choices.has(item.subject.id))
      choices.set(item.subject.id, { id: item.subject.id, name: item.subject.name, subgroup: "" })
  }
  return [...choices.values()].toSorted(byName)
}

/** How many suggestions wait in each group, for the group picker and the Today card. */
export function suggestionsByGroup(items: readonly StaffAssessmentItem[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const entry of item.audience) counts.set(entry.group_id, (counts.get(entry.group_id) ?? 0) + 1)
  }
  return counts
}
