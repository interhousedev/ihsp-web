// Academic — schedule: terms, groups, subjects, rooms, timetable, lessons, students, own timetable.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent, Page } from "../types/common"
import type {
  AdminGroupsParams,
  AdminLessonsParams,
  AdminRoomsParams,
  AdminStudentsParams,
  AdminSubjectsParams,
  AdminTimetableParams,
  ExtraLessonInput,
  GroupCreateBody,
  GroupDetail,
  GroupItem,
  GroupPatchBody,
  ImportConfirmResult,
  ImportPreview,
  LessonItem,
  LessonPatchBody,
  Room,
  RoomMergeBody,
  RoomRenameBody,
  StudentItem,
  StudentProfile,
  SubgroupAssignmentsBody,
  Subject,
  SubjectCreateBody,
  SubjectPatchBody,
  Term,
  TermInput,
  TermPatch,
  TimetableCheckResult,
  TimetableCopyBody,
  TimetableCopyResult,
  TimetableEntry,
  TimetableEntryInput,
  TimetablePatchBody,
  TimetableRangeParams,
} from "../types/schedule"

// --- Terms ---

/** GET /v1/admin/terms — admin. */
export function getAdminTerms(opts?: RequestOptions): Promise<Term[]> {
  return api.get<Term[]>("/v1/admin/terms", opts)
}
export const getAdminTermsQuery = () =>
  queryOptions({ queryKey: keys.admin.terms(), queryFn: ({ signal }) => getAdminTerms({ signal }) })

/** POST /v1/admin/terms — admin. */
export function postAdminTerms(body: TermInput, opts?: RequestOptions): Promise<Term> {
  return api.post<Term>("/v1/admin/terms", body, opts)
}

/** PATCH /v1/admin/terms/{id} — admin; partial `TermInput`. */
export function patchAdminTerm(id: string, body: TermPatch, opts?: RequestOptions): Promise<Term> {
  return api.patch<Term>(`/v1/admin/terms/${seg(id)}`, body, opts)
}

// --- Groups ---

/** GET /v1/admin/groups?status — admin. */
export function getAdminGroups(params?: AdminGroupsParams, opts?: RequestOptions): Promise<GroupItem[]> {
  return api.get<GroupItem[]>("/v1/admin/groups", { ...opts, query: params })
}
export const getAdminGroupsQuery = (params?: AdminGroupsParams) =>
  queryOptions({
    queryKey: keys.admin.groups.list(params),
    queryFn: ({ signal }) => getAdminGroups(params, { signal }),
  })

/** POST /v1/admin/groups — admin. */
export function postAdminGroups(body: GroupCreateBody, opts?: RequestOptions): Promise<GroupItem> {
  return api.post<GroupItem>("/v1/admin/groups", body, opts)
}

/** GET /v1/admin/groups/{id} — admin. */
export function getAdminGroup(id: string, opts?: RequestOptions): Promise<GroupDetail> {
  return api.get<GroupDetail>(`/v1/admin/groups/${seg(id)}`, opts)
}
export const getAdminGroupQuery = (id: string) =>
  queryOptions({ queryKey: keys.admin.groups.detail(id), queryFn: ({ signal }) => getAdminGroup(id, { signal }) })

/** PATCH /v1/admin/groups/{id} — admin. */
export function patchAdminGroup(id: string, body: GroupPatchBody, opts?: RequestOptions): Promise<GroupDetail> {
  return api.patch<GroupDetail>(`/v1/admin/groups/${seg(id)}`, body, opts)
}

/** PUT /v1/admin/groups/{id}/subgroups — admin. */
export function putAdminGroupSubgroups(
  id: string,
  body: SubgroupAssignmentsBody,
  opts?: RequestOptions,
): Promise<GroupDetail> {
  return api.put<GroupDetail>(`/v1/admin/groups/${seg(id)}/subgroups`, body, opts)
}

/** GET /v1/staff/groups — teacher; the groups the caller curates. */
export function getStaffGroups(opts?: RequestOptions): Promise<GroupItem[]> {
  return api.get<GroupItem[]>("/v1/staff/groups", opts)
}
export const getStaffGroupsQuery = () =>
  queryOptions({ queryKey: keys.staff.groups.list(), queryFn: ({ signal }) => getStaffGroups({ signal }) })

/** GET /v1/staff/groups/{id} — curator. */
export function getStaffGroup(id: string, opts?: RequestOptions): Promise<GroupDetail> {
  return api.get<GroupDetail>(`/v1/staff/groups/${seg(id)}`, opts)
}
export const getStaffGroupQuery = (id: string) =>
  queryOptions({ queryKey: keys.staff.groups.detail(id), queryFn: ({ signal }) => getStaffGroup(id, { signal }) })

/** PUT /v1/staff/groups/{id}/subgroups — curator. */
export function putStaffGroupSubgroups(
  id: string,
  body: SubgroupAssignmentsBody,
  opts?: RequestOptions,
): Promise<GroupDetail> {
  return api.put<GroupDetail>(`/v1/staff/groups/${seg(id)}/subgroups`, body, opts)
}

// --- Subjects ---

/** GET /v1/admin/subjects?query — admin. */
export function getAdminSubjects(params?: AdminSubjectsParams, opts?: RequestOptions): Promise<Subject[]> {
  return api.get<Subject[]>("/v1/admin/subjects", { ...opts, query: params })
}
export const getAdminSubjectsQuery = (params?: AdminSubjectsParams) =>
  queryOptions({
    queryKey: keys.admin.subjects(params),
    queryFn: ({ signal }) => getAdminSubjects(params, { signal }),
  })

/** POST /v1/admin/subjects — admin. */
export function postAdminSubjects(body: SubjectCreateBody, opts?: RequestOptions): Promise<Subject> {
  return api.post<Subject>("/v1/admin/subjects", body, opts)
}

/** PATCH /v1/admin/subjects/{id} — admin. */
export function patchAdminSubject(id: string, body: SubjectPatchBody, opts?: RequestOptions): Promise<Subject> {
  return api.patch<Subject>(`/v1/admin/subjects/${seg(id)}`, body, opts)
}

// --- Rooms ---

/** GET /v1/admin/rooms?status — admin. */
export function getAdminRooms(params?: AdminRoomsParams, opts?: RequestOptions): Promise<Room[]> {
  return api.get<Room[]>("/v1/admin/rooms", { ...opts, query: params })
}
export const getAdminRoomsQuery = (params?: AdminRoomsParams) =>
  queryOptions({
    queryKey: keys.admin.rooms(params),
    queryFn: ({ signal }) => getAdminRooms(params, { signal }),
  })

/** PATCH /v1/admin/rooms/{id} — admin. */
export function patchAdminRoom(id: string, body: RoomRenameBody, opts?: RequestOptions): Promise<Room> {
  return api.patch<Room>(`/v1/admin/rooms/${seg(id)}`, body, opts)
}

/** POST /v1/admin/rooms/{id}/regenerate-pin — admin. */
export function postAdminRoomRegeneratePin(id: string, opts?: RequestOptions): Promise<Room> {
  return api.post<Room>(`/v1/admin/rooms/${seg(id)}/regenerate-pin`, undefined, opts)
}

/** POST /v1/admin/rooms/{id}/merge — admin; returns the target room. */
export function postAdminRoomMerge(id: string, body: RoomMergeBody, opts?: RequestOptions): Promise<Room> {
  return api.post<Room>(`/v1/admin/rooms/${seg(id)}/merge`, body, opts)
}

/** POST /v1/admin/rooms/{id}/archive — admin. */
export function postAdminRoomArchive(id: string, opts?: RequestOptions): Promise<Room> {
  return api.post<Room>(`/v1/admin/rooms/${seg(id)}/archive`, undefined, opts)
}

// --- Timetable ---

/** GET /v1/admin/timetable?term_id&group_id|teacher_id|room_id — admin. */
export function getAdminTimetable(params: AdminTimetableParams, opts?: RequestOptions): Promise<TimetableEntry[]> {
  return api.get<TimetableEntry[]>("/v1/admin/timetable", { ...opts, query: params })
}
export const getAdminTimetableQuery = (params: AdminTimetableParams) =>
  queryOptions({
    queryKey: keys.admin.timetable(params),
    queryFn: ({ signal }) => getAdminTimetable(params, { signal }),
  })

/** POST /v1/admin/timetable — admin; `409 common/conflict` with `params.conflicts`. */
export function postAdminTimetable(body: TimetableEntryInput, opts?: RequestOptions): Promise<TimetableEntry> {
  return api.post<TimetableEntry>("/v1/admin/timetable", body, opts)
}

/** POST /v1/admin/timetable/check — admin. */
export function postAdminTimetableCheck(
  body: TimetableEntryInput,
  opts?: RequestOptions,
): Promise<TimetableCheckResult> {
  return api.post<TimetableCheckResult>("/v1/admin/timetable/check", body, opts)
}

/** PATCH /v1/admin/timetable/{id} — admin. */
export function patchAdminTimetable(
  id: string,
  body: TimetablePatchBody,
  opts?: RequestOptions,
): Promise<TimetableEntry> {
  return api.patch<TimetableEntry>(`/v1/admin/timetable/${seg(id)}`, body, opts)
}

/** DELETE /v1/admin/timetable/{id} — admin; `204`. */
export function deleteAdminTimetable(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/admin/timetable/${seg(id)}`, opts)
}

/** POST /v1/admin/timetable/copy — admin. */
export function postAdminTimetableCopy(body: TimetableCopyBody, opts?: RequestOptions): Promise<TimetableCopyResult> {
  return api.post<TimetableCopyResult>("/v1/admin/timetable/copy", body, opts)
}

// --- Lessons ---

/** GET /v1/admin/lessons — admin. */
export function getAdminLessons(params?: AdminLessonsParams, opts?: RequestOptions): Promise<Page<LessonItem>> {
  return api.get<Page<LessonItem>>("/v1/admin/lessons", { ...opts, query: params })
}
export const getAdminLessonsQuery = (params?: AdminLessonsParams) =>
  queryOptions({
    queryKey: keys.admin.lessons(params),
    queryFn: ({ signal }) => getAdminLessons(params, { signal }),
  })

/** POST /v1/admin/lessons — admin (extra lesson). */
export function postAdminLessons(body: ExtraLessonInput, opts?: RequestOptions): Promise<LessonItem> {
  return api.post<LessonItem>("/v1/admin/lessons", body, opts)
}

/** PATCH /v1/admin/lessons/{id} — admin. */
export function patchAdminLesson(id: string, body: LessonPatchBody, opts?: RequestOptions): Promise<LessonItem> {
  return api.patch<LessonItem>(`/v1/admin/lessons/${seg(id)}`, body, opts)
}

// --- Students ---

/** GET /v1/admin/students — admin. */
export function getAdminStudents(params?: AdminStudentsParams, opts?: RequestOptions): Promise<Page<StudentItem>> {
  return api.get<Page<StudentItem>>("/v1/admin/students", { ...opts, query: params })
}
export const getAdminStudentsQuery = (params?: AdminStudentsParams) =>
  queryOptions({
    queryKey: keys.admin.students.list(params),
    queryFn: ({ signal }) => getAdminStudents(params, { signal }),
  })

/** POST /v1/admin/students/import — admin; multipart `file` (CSV). */
export function postAdminStudentsImport(file: File, opts?: RequestOptions): Promise<ImportPreview> {
  const form = new FormData()
  form.append("file", file)
  return api.request<ImportPreview>({ ...opts, method: "POST", path: "/v1/admin/students/import", formData: form })
}

/** POST /v1/admin/students/import/{import_id}/confirm — admin. */
export function postAdminStudentsImportConfirm(importId: string, opts?: RequestOptions): Promise<ImportConfirmResult> {
  return api.post<ImportConfirmResult>(`/v1/admin/students/import/${seg(importId)}/confirm`, undefined, opts)
}

// --- Own profile and timetables ---

/** GET /v1/me/profile — student. */
export function getMeProfile(opts?: RequestOptions): Promise<StudentProfile> {
  return api.get<StudentProfile>("/v1/me/profile", opts)
}
export const getMeProfileQuery = () =>
  queryOptions({ queryKey: keys.me.profile(), queryFn: ({ signal }) => getMeProfile({ signal }) })

/** GET /v1/me/timetable?from&to — student. */
export function getMeTimetable(params?: TimetableRangeParams, opts?: RequestOptions): Promise<LessonItem[]> {
  return api.get<LessonItem[]>("/v1/me/timetable", { ...opts, query: params })
}
export const getMeTimetableQuery = (params?: TimetableRangeParams) =>
  queryOptions({
    queryKey: keys.me.timetable(params),
    queryFn: ({ signal }) => getMeTimetable(params, { signal }),
  })

/** GET /v1/staff/timetable?from&to — teacher. */
export function getStaffTimetable(params?: TimetableRangeParams, opts?: RequestOptions): Promise<LessonItem[]> {
  return api.get<LessonItem[]>("/v1/staff/timetable", { ...opts, query: params })
}
export const getStaffTimetableQuery = (params?: TimetableRangeParams) =>
  queryOptions({
    queryKey: keys.staff.timetable(params),
    queryFn: ({ signal }) => getStaffTimetable(params, { signal }),
  })

// --- Names used by the app plans ---

export const listAdminStudents = getAdminStudents
export const postStudentImport = postAdminStudentsImport
export const postStudentImportConfirm = postAdminStudentsImportConfirm
export const putAdminSubgroups = putAdminGroupSubgroups
export const putStaffSubgroups = putStaffGroupSubgroups
export const postTimetableCheck = postAdminTimetableCheck
