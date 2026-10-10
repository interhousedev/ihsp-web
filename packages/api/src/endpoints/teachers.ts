// "My teachers" and teacher contacts.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { MyTeacher, TeacherContacts } from "../types/teachers"

/** GET /v1/me/teachers — student. */
export function getMeTeachers(opts?: RequestOptions): Promise<MyTeacher[]> {
  return api.get<MyTeacher[]>("/v1/me/teachers", opts)
}
export const getMeTeachersQuery = () =>
  queryOptions({ queryKey: keys.me.teachers(), queryFn: ({ signal }) => getMeTeachers({ signal }) })

/** GET /v1/staff/me/contacts — teacher: the caller's own contacts. */
export function getStaffMeContacts(opts?: RequestOptions): Promise<TeacherContacts> {
  return api.get<TeacherContacts>("/v1/staff/me/contacts", opts)
}
export const getStaffMeContactsQuery = () =>
  queryOptions({ queryKey: keys.staff.contacts(), queryFn: ({ signal }) => getStaffMeContacts({ signal }) })

/** PUT /v1/staff/me/contacts — teacher: replaces the caller's contacts; `422` for a bad email, phone or Telegram name. */
export function putStaffMeContacts(body: TeacherContacts, opts?: RequestOptions): Promise<TeacherContacts> {
  return api.put<TeacherContacts>("/v1/staff/me/contacts", body, opts)
}

/** GET /v1/admin/teacher-contacts/{id} — admin. */
export function getAdminTeacherContacts(id: string, opts?: RequestOptions): Promise<TeacherContacts> {
  return api.get<TeacherContacts>(`/v1/admin/teacher-contacts/${seg(id)}`, opts)
}
export const getAdminTeacherContactsQuery = (id: string) =>
  queryOptions({
    queryKey: keys.admin.teacherContacts(id),
    queryFn: ({ signal }) => getAdminTeacherContacts(id, { signal }),
  })

/** PUT /v1/admin/teacher-contacts/{id} — admin: replaces a teacher's contacts. */
export function putAdminTeacherContacts(
  id: string,
  body: TeacherContacts,
  opts?: RequestOptions,
): Promise<TeacherContacts> {
  return api.put<TeacherContacts>(`/v1/admin/teacher-contacts/${seg(id)}`, body, opts)
}
