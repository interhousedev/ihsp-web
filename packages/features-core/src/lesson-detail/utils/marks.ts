import type { AttendanceSheet, AttendanceSubmitBody, RosterItem } from "@ihsp/api"

/**
 * A roster item with the `counted` flag of backend task B4: whether a student without a subgroup is counted for the
 * lesson. `@ihsp/api` does not have the field yet (I3 reconciles the types), so it is optional here.
 */
export type SheetRosterItem = RosterItem & { counted?: boolean }

/**
 * What the teacher marked for one student. Students of the audience are `present` or `absent` (everyone starts
 * present). A student without a subgroup who is not counted yet starts as `none` and counts only when marked
 * (ACA-2): `present` goes to `present_unassigned`, `absent` to `absent`.
 */
export type Mark = "present" | "absent" | "none"
export type Marks = Record<string, Mark>

export function rosterOf(sheet: AttendanceSheet): SheetRosterItem[] {
  return sheet.roster
}

/** Is a student without a subgroup counted for this lesson? Without the `counted` flag a saved sheet only lists counted ones. */
function isCounted(item: SheetRosterItem, sheet: AttendanceSheet): boolean {
  return item.counted ?? (sheet.submitted || item.absent)
}

/** Listed in the "no subgroup" section: no subgroup and not counted for this lesson (yet). */
export function isUncounted(item: SheetRosterItem, sheet: AttendanceSheet): boolean {
  return item.subgroup_unset && !isCounted(item, sheet)
}

/** Marks of a saved or fresh sheet. */
export function initialMarks(sheet: AttendanceSheet): Marks {
  const marks: Marks = {}
  for (const item of rosterOf(sheet)) {
    if (item.absent) marks[item.user_id] = "absent"
    else if (isUncounted(item, sheet)) marks[item.user_id] = "none"
    else marks[item.user_id] = "present"
  }
  return marks
}

export function sameMarks(a: Marks, b: Marks): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) if ((a[key] ?? "none") !== (b[key] ?? "none")) return false
  return true
}

/** Tap on a student of the audience: present becomes absent and back. */
export function toggleAbsent(marks: Marks, userId: string): Marks {
  return { ...marks, [userId]: marks[userId] === "absent" ? "present" : "absent" }
}

/** Present / Absent buttons of an uncounted student: tapping the active one clears the mark. */
export function setUnassignedMark(marks: Marks, userId: string, mark: "present" | "absent"): Marks {
  return { ...marks, [userId]: marks[userId] === mark ? "none" : mark }
}

/** "Everyone present": clears all absences; uncounted students keep a "present" mark and are otherwise not counted. */
export function everyonePresent(marks: Marks, sheet: AttendanceSheet): Marks {
  const next: Marks = {}
  for (const item of rosterOf(sheet)) {
    next[item.user_id] = isUncounted(item, sheet) ? (marks[item.user_id] === "present" ? "present" : "none") : "present"
  }
  return next
}

export function absentCount(marks: Marks): number {
  return Object.values(marks).filter((mark) => mark === "absent").length
}

/**
 * The body of `PUT /v1/staff/lessons/{id}/attendance`: exactly the list the teacher saw. Students without a subgroup
 * who are present go to `present_unassigned` (also the already counted ones, so they stay in the saved roster).
 */
export function buildSubmitBody(marks: Marks, sheet: AttendanceSheet, baseVersion: number): AttendanceSubmitBody {
  const absent: string[] = []
  const presentUnassigned: string[] = []
  for (const item of rosterOf(sheet)) {
    const mark = marks[item.user_id] ?? "none"
    if (mark === "absent") absent.push(item.user_id)
    else if (mark === "present" && item.subgroup_unset) presentUnassigned.push(item.user_id)
  }
  return { absent, present_unassigned: presentUnassigned, base_version: baseVersion }
}

export type RosterSection = { key: string; heading: string | null; uncounted: boolean; items: SheetRosterItem[] }

/**
 * Sections of the list: students of the audience (one section per group when groups were merged into one lesson),
 * then the uncounted students without a subgroup in a section of their own.
 */
export function rosterSections(sheet: AttendanceSheet): RosterSection[] {
  const roster = rosterOf(sheet)
  const counted = roster.filter((item) => !isUncounted(item, sheet))
  const uncounted = roster.filter((item) => isUncounted(item, sheet))
  const groupNames = [...new Set(counted.map((item) => item.group_name))]
  const sections: RosterSection[] = groupNames.map((name) => ({
    key: `group:${name}`,
    heading: groupNames.length > 1 ? name : null,
    uncounted: false,
    items: counted.filter((item) => item.group_name === name),
  }))
  if (uncounted.length > 0) sections.push({ key: "uncounted", heading: null, uncounted: true, items: uncounted })
  return sections
}
