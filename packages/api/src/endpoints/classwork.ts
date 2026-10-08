// Academic — classwork: today, lessons, homework, attendance, journal, attendance reports.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  AdminAttendanceParams,
  AttendanceExcuseBody,
  AttendanceReport,
  AttendanceSheet,
  AttendanceSubmitBody,
  CuratorStudent,
  GroupAttendanceParams,
  HomeworkDoneBody,
  HomeworkItem,
  HomeworkListParams,
  HomeworkNoteBody,
  Journal,
  JournalOption,
  JournalParams,
  JournalToggleBody,
  JournalToggleResult,
  MissingAttendanceItem,
  MissingAttendanceParams,
  StaffHomeworkBody,
  StaffLesson,
  StaffToday,
  StaffTopicBody,
  StudentAttendance,
  StudentAttendanceParams,
  StudentLesson,
  StudentToday,
} from "../types/classwork"

// --- Student ---

/** GET /v1/me/today — student. */
export function getMeToday(opts?: RequestOptions): Promise<StudentToday> {
  return api.get<StudentToday>("/v1/me/today", opts)
}
export const getMeTodayQuery = () =>
  queryOptions({ queryKey: keys.me.today(), queryFn: ({ signal }) => getMeToday({ signal }) })

/** GET /v1/me/lessons/{id} — student in the lesson's audience. */
export function getMeLesson(id: string, opts?: RequestOptions): Promise<StudentLesson> {
  return api.get<StudentLesson>(`/v1/me/lessons/${seg(id)}`, opts)
}
export const getMeLessonQuery = (id: string) =>
  queryOptions({ queryKey: keys.lessons.detail(id), queryFn: ({ signal }) => getMeLesson(id, { signal }) })

/** GET /v1/me/homework?status=upcoming|later|done — student. */
export function getMeHomework(params?: HomeworkListParams, opts?: RequestOptions): Promise<HomeworkItem[]> {
  return api.get<HomeworkItem[]>("/v1/me/homework", { ...opts, query: params })
}
export const getMeHomeworkQuery = (params?: HomeworkListParams) =>
  queryOptions({
    queryKey: keys.me.homework(params),
    queryFn: ({ signal }) => getMeHomework(params, { signal }),
  })

/** PUT /v1/me/homework/{lesson_id}/done — student. */
export function putMeHomeworkDone(
  lessonId: string,
  body: HomeworkDoneBody,
  opts?: RequestOptions,
): Promise<HomeworkItem> {
  return api.put<HomeworkItem>(`/v1/me/homework/${seg(lessonId)}/done`, body, opts)
}

/** PUT /v1/me/homework/{lesson_id}/note — student. */
export function putMeHomeworkNote(
  lessonId: string,
  body: HomeworkNoteBody,
  opts?: RequestOptions,
): Promise<HomeworkItem> {
  return api.put<HomeworkItem>(`/v1/me/homework/${seg(lessonId)}/note`, body, opts)
}

/** GET /v1/me/attendance?from&to — student. */
export function getMeAttendance(params?: StudentAttendanceParams, opts?: RequestOptions): Promise<StudentAttendance> {
  return api.get<StudentAttendance>("/v1/me/attendance", { ...opts, query: params })
}
export const getMeAttendanceQuery = (params?: StudentAttendanceParams) =>
  queryOptions({
    queryKey: keys.me.attendance(params),
    queryFn: ({ signal }) => getMeAttendance(params, { signal }),
  })

// --- Teacher ---

/** GET /v1/staff/today — teacher. */
export function getStaffToday(opts?: RequestOptions): Promise<StaffToday> {
  return api.get<StaffToday>("/v1/staff/today", opts)
}
export const getStaffTodayQuery = () =>
  queryOptions({ queryKey: keys.staff.today(), queryFn: ({ signal }) => getStaffToday({ signal }) })

/** GET /v1/staff/lessons/{id} — teacher of the lesson, or admin. */
export function getStaffLesson(id: string, opts?: RequestOptions): Promise<StaffLesson> {
  return api.get<StaffLesson>(`/v1/staff/lessons/${seg(id)}`, opts)
}
export const getStaffLessonQuery = (id: string) =>
  queryOptions({ queryKey: keys.staff.lesson(id), queryFn: ({ signal }) => getStaffLesson(id, { signal }) })

/** PUT /v1/staff/lessons/{id}/homework — teacher of the lesson. */
export function putStaffLessonHomework(
  id: string,
  body: StaffHomeworkBody,
  opts?: RequestOptions,
): Promise<StaffLesson> {
  return api.put<StaffLesson>(`/v1/staff/lessons/${seg(id)}/homework`, body, opts)
}

/** DELETE /v1/staff/lessons/{id}/homework — teacher of the lesson; returns the updated lesson. */
export function deleteStaffLessonHomework(id: string, opts?: RequestOptions): Promise<StaffLesson> {
  return api.delete<StaffLesson>(`/v1/staff/lessons/${seg(id)}/homework`, opts)
}

/** PUT /v1/staff/lessons/{id}/topic — teacher of the lesson. */
export function putStaffLessonTopic(id: string, body: StaffTopicBody, opts?: RequestOptions): Promise<StaffLesson> {
  return api.put<StaffLesson>(`/v1/staff/lessons/${seg(id)}/topic`, body, opts)
}

/**
 * PUT /v1/staff/lessons/{id}/attendance — teacher (within 7 days) or admin.
 * `409 common/conflict` carries the current sheet in `params.theirs`; `403 attendance/window-closed` after the window.
 */
export function putStaffLessonAttendance(
  id: string,
  body: AttendanceSubmitBody,
  opts?: RequestOptions,
): Promise<AttendanceSheet> {
  return api.put<AttendanceSheet>(`/v1/staff/lessons/${seg(id)}/attendance`, body, opts)
}

/** PUT /v1/staff/lessons/{id}/attendance/excuse — curator of the student's group, or admin. */
export function putStaffLessonAttendanceExcuse(
  id: string,
  body: AttendanceExcuseBody,
  opts?: RequestOptions,
): Promise<AttendanceSheet> {
  return api.put<AttendanceSheet>(`/v1/staff/lessons/${seg(id)}/attendance/excuse`, body, opts)
}

/** GET /v1/staff/journal?subject_id&audience_key&term_id — teacher. */
export function getStaffJournal(params: JournalParams, opts?: RequestOptions): Promise<Journal> {
  return api.get<Journal>("/v1/staff/journal", { ...opts, query: params })
}
export const getStaffJournalQuery = (params: JournalParams) =>
  queryOptions({
    queryKey: keys.staff.journal.grid(params),
    queryFn: ({ signal }) => getStaffJournal(params, { signal }),
  })

/** GET /v1/staff/journal/options — teacher. */
export function getStaffJournalOptions(opts?: RequestOptions): Promise<JournalOption[]> {
  return api.get<JournalOption[]>("/v1/staff/journal/options", opts)
}
export const getStaffJournalOptionsQuery = () =>
  queryOptions({
    queryKey: keys.staff.journal.options(),
    queryFn: ({ signal }) => getStaffJournalOptions({ signal }),
  })

/** POST /v1/staff/journal/toggle — teacher (within 7 days). */
export function postStaffJournalToggle(body: JournalToggleBody, opts?: RequestOptions): Promise<JournalToggleResult> {
  return api.post<JournalToggleResult>("/v1/staff/journal/toggle", body, opts)
}

/** GET /v1/staff/journal.csv — teacher; CSV as a `Blob`. */
export function getStaffJournalCsv(params: JournalParams, opts?: RequestOptions): Promise<Blob> {
  return api.get<Blob>("/v1/staff/journal.csv", { ...opts, query: params, responseType: "blob" })
}

// --- Curator ---

/** GET /v1/staff/groups/{id}/attendance?view&from&to — curator. */
export function getStaffGroupAttendance(
  id: string,
  params: GroupAttendanceParams,
  opts?: RequestOptions,
): Promise<AttendanceReport> {
  return api.get<AttendanceReport>(`/v1/staff/groups/${seg(id)}/attendance`, { ...opts, query: params })
}
export const getStaffGroupAttendanceQuery = (id: string, params: GroupAttendanceParams) =>
  queryOptions({
    queryKey: keys.staff.groups.attendance(id, params),
    queryFn: ({ signal }) => getStaffGroupAttendance(id, params, { signal }),
  })

/** GET /v1/staff/groups/{id}/attendance.csv — curator; CSV as a `Blob`. */
export function getStaffGroupAttendanceCsv(
  id: string,
  params: GroupAttendanceParams,
  opts?: RequestOptions,
): Promise<Blob> {
  return api.get<Blob>(`/v1/staff/groups/${seg(id)}/attendance.csv`, {
    ...opts,
    query: params,
    responseType: "blob",
  })
}

/** GET /v1/staff/groups/{id}/students — curator. */
export function getStaffGroupStudents(id: string, opts?: RequestOptions): Promise<CuratorStudent[]> {
  return api.get<CuratorStudent[]>(`/v1/staff/groups/${seg(id)}/students`, opts)
}
export const getStaffGroupStudentsQuery = (id: string) =>
  queryOptions({
    queryKey: keys.staff.groups.students(id),
    queryFn: ({ signal }) => getStaffGroupStudents(id, { signal }),
  })

// --- Admin ---

/** GET /v1/admin/attendance?view&from&to&group_id — admin. */
export function getAdminAttendance(params: AdminAttendanceParams, opts?: RequestOptions): Promise<AttendanceReport> {
  return api.get<AttendanceReport>("/v1/admin/attendance", { ...opts, query: params })
}
export const getAdminAttendanceQuery = (params: AdminAttendanceParams) =>
  queryOptions({
    queryKey: keys.admin.attendance.report(params),
    queryFn: ({ signal }) => getAdminAttendance(params, { signal }),
  })

/** GET /v1/admin/attendance/missing?from&to — admin. */
export function getAdminAttendanceMissing(
  params?: MissingAttendanceParams,
  opts?: RequestOptions,
): Promise<MissingAttendanceItem[]> {
  return api.get<MissingAttendanceItem[]>("/v1/admin/attendance/missing", { ...opts, query: params })
}
export const getAdminAttendanceMissingQuery = (params?: MissingAttendanceParams) =>
  queryOptions({
    queryKey: keys.admin.attendance.missing(params),
    queryFn: ({ signal }) => getAdminAttendanceMissing(params, { signal }),
  })

/** GET /v1/admin/attendance.csv — admin; CSV as a `Blob`. */
export function getAdminAttendanceCsv(params: AdminAttendanceParams, opts?: RequestOptions): Promise<Blob> {
  return api.get<Blob>("/v1/admin/attendance.csv", { ...opts, query: params, responseType: "blob" })
}

// --- Names used by the app plans ---

export const getStudentToday = getMeToday
export const getMyLesson = getMeLesson
export const listMyHomework = getMeHomework
export const putHomeworkDone = putMeHomeworkDone
export const putHomeworkNote = putMeHomeworkNote
export const getMyAttendance = getMeAttendance
export const putStaffHomework = putStaffLessonHomework
export const deleteStaffHomework = deleteStaffLessonHomework
export const putStaffTopic = putStaffLessonTopic
export const putStaffAttendance = putStaffLessonAttendance
export const putAttendanceExcuse = putStaffLessonAttendanceExcuse
export const getJournal = getStaffJournal
export const getJournalOptions = getStaffJournalOptions
export const postJournalToggle = postStaffJournalToggle
export const getJournalCsv = getStaffJournalCsv
