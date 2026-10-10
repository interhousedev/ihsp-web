// "My teachers", teacher contacts and teacher photos.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  MyTeacher,
  TeacherContacts,
  TeacherSlot,
  TeacherTimetableParams,
  UserPhotoResponse,
} from "../types/teachers"

/** GET /v1/me/teachers — student. */
export function getMeTeachers(opts?: RequestOptions): Promise<MyTeacher[]> {
  return api.get<MyTeacher[]>("/v1/me/teachers", opts)
}
export const getMeTeachersQuery = () =>
  queryOptions({ queryKey: keys.me.teachers(), queryFn: ({ signal }) => getMeTeachers({ signal }) })

/** GET /v1/me/teachers/{teacher_id} — student; `404` when the teacher does not teach the caller. */
export function getMeTeacher(teacherId: string, opts?: RequestOptions): Promise<MyTeacher> {
  return api.get<MyTeacher>(`/v1/me/teachers/${seg(teacherId)}`, opts)
}
export const getMeTeacherQuery = (teacherId: string) =>
  queryOptions({
    queryKey: keys.me.teacher(teacherId),
    queryFn: ({ signal }) => getMeTeacher(teacherId, { signal }),
  })

/** GET /v1/me/teachers/{teacher_id}/timetable?from&to — student: all the teacher's groups, Monday to Friday; `mine` marks the student's group. */
export function getMeTeacherTimetable(
  teacherId: string,
  params?: TeacherTimetableParams,
  opts?: RequestOptions,
): Promise<TeacherSlot[]> {
  return api.get<TeacherSlot[]>(`/v1/me/teachers/${seg(teacherId)}/timetable`, { ...opts, query: params })
}
export const getMeTeacherTimetableQuery = (teacherId: string, params?: TeacherTimetableParams) =>
  queryOptions({
    queryKey: keys.me.teacherTimetable(teacherId, params),
    queryFn: ({ signal }) => getMeTeacherTimetable(teacherId, params, { signal }),
  })

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

/** PUT /v1/staff/me/photo — teacher: multipart `file`, JPEG or PNG up to 5 MB; `422` for another type, `413` for a larger file. */
export function putStaffMePhoto(file: File, opts?: RequestOptions): Promise<UserPhotoResponse> {
  const form = new FormData()
  form.append("file", file)
  return api.request<UserPhotoResponse>({ ...opts, method: "PUT", path: "/v1/staff/me/photo", formData: form })
}

/** DELETE /v1/staff/me/photo — teacher: removes the caller's photo. */
export function deleteStaffMePhoto(opts?: RequestOptions): Promise<UserPhotoResponse> {
  return api.delete<UserPhotoResponse>("/v1/staff/me/photo", opts)
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

/** PUT /v1/admin/users/{id}/photo — admin: multipart `file`, JPEG or PNG up to 5 MB. */
export function putAdminUserPhoto(userId: string, file: File, opts?: RequestOptions): Promise<UserPhotoResponse> {
  const form = new FormData()
  form.append("file", file)
  return api.request<UserPhotoResponse>({
    ...opts,
    method: "PUT",
    path: `/v1/admin/users/${seg(userId)}/photo`,
    formData: form,
  })
}

/** DELETE /v1/admin/users/{id}/photo — admin: removes the user's photo (idempotent). */
export function deleteAdminUserPhoto(userId: string, opts?: RequestOptions): Promise<UserPhotoResponse> {
  return api.delete<UserPhotoResponse>(`/v1/admin/users/${seg(userId)}/photo`, opts)
}
