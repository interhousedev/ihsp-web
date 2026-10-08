import type { GroupStudent, SubgroupAssignmentsBody } from "@ihsp/api"

export type Subgroup = 1 | 2 | null
/** Changes the curator made and has not saved yet: student id to the new subgroup. */
export type Pending = Readonly<Record<string, Subgroup>>

/** The subgroup shown for a student: the unsaved change if there is one, otherwise the saved value. */
export function effectiveSubgroup(student: Pick<GroupStudent, "user_id" | "subgroup">, pending: Pending): Subgroup {
  return student.user_id in pending ? (pending[student.user_id] ?? null) : student.subgroup
}

/** New students (no subgroup) first, then by last name and first name (UF-STF-10 step 1). */
export function sortForAssignment(students: readonly GroupStudent[]): GroupStudent[] {
  return students
    .filter((student) => student.status === "active")
    .toSorted(
      (a, b) =>
        Number(b.subgroup === null) - Number(a.subgroup === null) ||
        a.last_name.localeCompare(b.last_name) ||
        a.first_name.localeCompare(b.first_name),
    )
}

/** Sets the same subgroup for several students; a value equal to the saved one drops the pending change. */
export function assign(
  pending: Pending,
  students: readonly GroupStudent[],
  userIds: readonly string[],
  subgroup: Subgroup,
): Pending {
  const next: Record<string, Subgroup> = { ...pending }
  for (const id of userIds) {
    const saved = students.find((student) => student.user_id === id)?.subgroup ?? null
    if (saved === subgroup) delete next[id]
    else next[id] = subgroup
  }
  return next
}

/** The body of `PUT /v1/staff/groups/{id}/subgroups`: only the students that changed. */
export function toBody(pending: Pending): SubgroupAssignmentsBody {
  return { assignments: Object.entries(pending).map(([user_id, subgroup]) => ({ user_id, subgroup })) }
}
