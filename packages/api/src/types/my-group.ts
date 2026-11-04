// "My group": the student's group with its homeroom teacher, head student and members.

import type { TeacherContacts } from "./teachers"

/** A person of the group, by name. */
export type GroupPersonRef = { id: string; first_name: string; last_name: string }

/** The homeroom teacher, with the public contacts shown to students. */
export type GroupTeacherRef = GroupPersonRef & { contacts: TeacherContacts }

/** One active student of the caller's group; `is_head_student` marks the head, `is_me` the caller. */
export type GroupMemberRow = GroupPersonRef & { is_head_student: boolean; is_me: boolean }

/** GET /v1/me/group. `homeroom_teacher` and `head_student` are null when unassigned. */
export type MyGroup = {
  id: string
  name: string
  size: number
  /** Whether the group progress and the group rating are open to the caller. */
  is_head_student: boolean
  homeroom_teacher: GroupTeacherRef | null
  head_student: GroupPersonRef | null
  members: GroupMemberRow[]
}
