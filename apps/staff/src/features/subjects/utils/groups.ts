import type { LessonItem, StaffSubjectGroup } from "@ihsp/api"

/** A key of a group half: the group id, and `:1` or `:2` for a subgroup. */
export function groupKey(group: Pick<StaffSubjectGroup, "group_id" | "subgroup">): string {
  return group.subgroup === null ? group.group_id : `${group.group_id}:${group.subgroup}`
}

/** The groups of the subject by group (a divided subject has one entry per subgroup under the same group). */
export function byGroup(
  groups: readonly StaffSubjectGroup[],
): { group_id: string; group_name: string; halves: number[] }[] {
  const found = new Map<string, { group_id: string; group_name: string; halves: number[] }>()
  for (const group of groups) {
    const entry = found.get(group.group_id) ?? { group_id: group.group_id, group_name: group.group_name, halves: [] }
    if (group.subgroup !== null) entry.halves.push(group.subgroup)
    found.set(group.group_id, entry)
  }
  return [...found.values()]
}

/** The next lessons of the subject for the group (any subgroup), from the teacher's timetable, earliest first. */
export function groupLessons(
  lessons: readonly LessonItem[],
  subjectId: string,
  groupId: string,
  limit = 5,
): LessonItem[] {
  return lessons
    .filter(
      (lesson) =>
        lesson.subject.id === subjectId &&
        lesson.status === "scheduled" &&
        lesson.audience.some((entry) => entry.group_id === groupId),
    )
    .toSorted((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, limit)
}
