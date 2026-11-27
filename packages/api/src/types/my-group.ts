// "My group": the student's group with its homeroom teacher, head student and members.

import type { TeacherContacts } from "./teachers"

/** A person of the group, by name. */
export type GroupPersonRef = { id: string; first_name: string; last_name: string; photo_url: string | null }

/** The homeroom teacher, with the public contacts shown to students. */
export type GroupTeacherRef = GroupPersonRef & { contacts: TeacherContacts }

/** One active student of the caller's group; `is_head_student` marks the head, `is_me` the caller. */
export type GroupMemberRow = GroupPersonRef & { is_head_student: boolean; is_me: boolean }

/** The group's card: name and course. */
export type GroupCard = { id: string; name: string; course: number | null }

/** The group's curator. */
export type GroupCuratorRef = { id: string; full_name: string; photo_url: string | null }

/** One row of a top of classmates; `value` is the GPA or the attendance percent. */
export type GroupTopRow = {
  rank: number
  student_id: string
  full_name: string
  photo_url: string | null
  value: number | null
  is_me: boolean
}

export type GroupPlace = { place: number; total: number }
export type GroupScopeRanks = { gpa: GroupPlace | null; attendance: GroupPlace | null }
export type GroupRanks = { course: GroupScopeRanks; lyceum: GroupScopeRanks }

/** GET /v1/me/group. `homeroom_teacher` and `head_student` are null when unassigned. */
export type MyGroup = {
  id: string
  name: string
  size: number
  /** Whether the group progress and the group rating are open to the caller. */
  is_head_student: boolean
  homeroom_teacher: GroupTeacherRef | null
  head_student: (GroupPersonRef & { full_name: string }) | null
  members: GroupMemberRow[]
  group: GroupCard
  curator: GroupCuratorRef | null
  members_count: number
  top_by_grade: GroupTopRow[]
  top_by_attendance: GroupTopRow[]
  ranks: GroupRanks
}
