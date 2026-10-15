// Academic — marks (EMIS-synced grades) and sync runs.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent, Page } from "../types/common"
import type {
  DayGrades,
  RecordBook,
  SemesterGrades,
  SemesterParams,
  SubjectCard,
  LessonResult,
  SubjectDetail,
  SubjectLessonList,
  SubjectLessonsParams,
  ResyncMaterialsBody,
  SyncRunBody,
  SyncRunItem,
  SyncRunsParams,
} from "../types/marks"

/** GET /v1/me/subjects?semester — student. */
export function getMeSubjects(params?: SemesterParams, opts?: RequestOptions): Promise<SubjectCard[]> {
  return api.get<SubjectCard[]>("/v1/me/subjects", { ...opts, query: params })
}
export const getMeSubjectsQuery = (params?: SemesterParams) =>
  queryOptions({
    queryKey: keys.me.subjects(params),
    queryFn: ({ signal }) => getMeSubjects(params, { signal }),
  })

/** GET /v1/me/subjects/{subject_id}?semester — student. */
export function getMeSubject(
  subjectId: string,
  params?: SemesterParams,
  opts?: RequestOptions,
): Promise<SubjectDetail> {
  return api.get<SubjectDetail>(`/v1/me/subjects/${seg(subjectId)}`, { ...opts, query: params })
}
export const getMeSubjectQuery = (subjectId: string, params?: SemesterParams) =>
  queryOptions({
    queryKey: keys.me.subject(subjectId, params),
    queryFn: ({ signal }) => getMeSubject(subjectId, params, { signal }),
  })

/** GET /v1/me/subjects/{subject_id}/lessons?around=now — student; the subject hub list. */
export function getMeSubjectLessons(
  subjectId: string,
  params?: SubjectLessonsParams,
  opts?: RequestOptions,
): Promise<SubjectLessonList> {
  return api.get<SubjectLessonList>(`/v1/me/subjects/${seg(subjectId)}/lessons`, {
    ...opts,
    query: { around: "now", ...params },
  })
}
export const getMeSubjectLessonsQuery = (subjectId: string, params?: SubjectLessonsParams) =>
  queryOptions({
    queryKey: keys.me.subjectLessons(subjectId, params),
    queryFn: ({ signal }) => getMeSubjectLessons(subjectId, params, { signal }),
  })

/** GET /v1/me/lesson-results?from&to — student; attendance and mark of lessons that already started (calendar dots). */
export function getMeLessonResults(
  params: { from: string; to: string },
  opts?: RequestOptions,
): Promise<LessonResult[]> {
  return api.get<LessonResult[]>("/v1/me/lesson-results", { ...opts, query: params })
}
export const getMeLessonResultsQuery = (params: { from: string; to: string }) =>
  queryOptions({
    queryKey: keys.me.lessonResults(params),
    queryFn: ({ signal }) => getMeLessonResults(params, { signal }),
  })

/** GET /v1/me/grades?semester — student. */
export function getMeGrades(params?: SemesterParams, opts?: RequestOptions): Promise<SemesterGrades> {
  return api.get<SemesterGrades>("/v1/me/grades", { ...opts, query: params })
}
export const getMeGradesQuery = (params?: SemesterParams) =>
  queryOptions({
    queryKey: keys.me.grades(params),
    queryFn: ({ signal }) => getMeGrades(params, { signal }),
  })

/** GET /v1/me/grades/day?date — student; `date` is `YYYY-MM-DD`. */
export function getMeGradesDay(date?: string, opts?: RequestOptions): Promise<DayGrades> {
  return api.get<DayGrades>("/v1/me/grades/day", { ...opts, query: { date } })
}
export const getMeGradesDayQuery = (date?: string) =>
  queryOptions({
    queryKey: keys.me.gradesDay(date),
    queryFn: ({ signal }) => getMeGradesDay(date, { signal }),
  })

/** GET /v1/me/record-book — student. */
export function getMeRecordBook(opts?: RequestOptions): Promise<RecordBook> {
  return api.get<RecordBook>("/v1/me/record-book", opts)
}
export const getMeRecordBookQuery = () =>
  queryOptions({ queryKey: keys.me.recordBook(), queryFn: ({ signal }) => getMeRecordBook({ signal }) })

/** GET /v1/admin/sync/runs?cursor — admin. */
export function getAdminSyncRuns(params?: SyncRunsParams, opts?: RequestOptions): Promise<Page<SyncRunItem>> {
  return api.get<Page<SyncRunItem>>("/v1/admin/sync/runs", { ...opts, query: params })
}
export const getAdminSyncRunsQuery = (params?: SyncRunsParams) =>
  queryOptions({
    queryKey: keys.admin.syncRuns(params),
    queryFn: ({ signal }) => getAdminSyncRuns(params, { signal }),
  })

/** POST /v1/admin/sync/run — admin; `202`, a manual run for one student or everyone. */
export function postAdminSyncRun(body?: SyncRunBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/admin/sync/run", body ?? {}, opts)
}

/**
 * POST /v1/admin/sync/materials — admin; `202`. The worker replaces every EMIS material
 * of the chosen terms (deletes the EMIS files, downloads them fresh).
 * TODO(contract): replace with generated
 */
export function postAdminSyncMaterials(body: ResyncMaterialsBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/admin/sync/materials", body, opts)
}

// --- Names used by the app plans ---

export const listMySubjects = getMeSubjects
export const getMySubject = getMeSubject
export const getMyGrades = getMeGrades
export const getMyGradesDay = getMeGradesDay
export const getRecordBook = getMeRecordBook
export const listSyncRuns = getAdminSyncRuns
export const postSyncRun = postAdminSyncRun
