// Academic — assessments (midterm and final controls) and the mark planner.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  AssessmentCreateBody,
  AssessmentItem,
  AssessmentList,
  AssessmentPatchBody,
  AssessmentProposalBody,
  AssessmentsParams,
  PlannerParams,
  StaffAssessmentItem,
  StaffAssessmentList,
  StaffAssessmentsParams,
  SubjectPlanner,
} from "../types/assessments"
import type { NoContent } from "../types/common"

// --- Student ---

/** GET /v1/me/assessments?from&to&subject_id — student. */
export function getMeAssessments(params?: AssessmentsParams, opts?: RequestOptions): Promise<AssessmentList> {
  return api.get<AssessmentList>("/v1/me/assessments", { ...opts, query: params })
}
export const getMeAssessmentsQuery = (params?: AssessmentsParams) =>
  queryOptions({
    queryKey: keys.me.assessments(params),
    queryFn: ({ signal }) => getMeAssessments(params, { signal }),
  })

/** POST /v1/me/assessments — student (the group's head student only); the control stays tentative. */
export function postMeAssessment(body: AssessmentProposalBody, opts?: RequestOptions): Promise<AssessmentItem> {
  return api.post<AssessmentItem>("/v1/me/assessments", body, opts)
}

/** GET /v1/me/subjects/{subject_id}/planner?semester&what_if — student. */
export function getMeSubjectPlanner(
  subjectId: string,
  params?: PlannerParams,
  opts?: RequestOptions,
): Promise<SubjectPlanner> {
  return api.get<SubjectPlanner>(`/v1/me/subjects/${seg(subjectId)}/planner`, { ...opts, query: params })
}
export const getMeSubjectPlannerQuery = (subjectId: string, params?: PlannerParams) =>
  queryOptions({
    queryKey: keys.me.planner(subjectId, params),
    queryFn: ({ signal }) => getMeSubjectPlanner(subjectId, params, { signal }),
  })

// --- Staff ---

/** GET /v1/staff/assessments?from&to&subject_id&group_id&kind&status&source&undated — teacher, admin. */
export function getStaffAssessments(
  params?: StaffAssessmentsParams,
  opts?: RequestOptions,
): Promise<StaffAssessmentList> {
  return api.get<StaffAssessmentList>("/v1/staff/assessments", { ...opts, query: params })
}
export const getStaffAssessmentsQuery = (params?: StaffAssessmentsParams) =>
  queryOptions({
    queryKey: keys.staff.assessments(params),
    queryFn: ({ signal }) => getStaffAssessments(params, { signal }),
  })

/** POST /v1/staff/assessments — teacher of the subject in every group of the audience, admin. */
export function postStaffAssessment(body: AssessmentCreateBody, opts?: RequestOptions): Promise<StaffAssessmentItem> {
  return api.post<StaffAssessmentItem>("/v1/staff/assessments", body, opts)
}

/** PATCH /v1/staff/assessments/{id} — edit, confirm (`status: "planned"`) or dismiss (`status: "cancelled"`). */
export function patchStaffAssessment(
  id: string,
  body: AssessmentPatchBody,
  opts?: RequestOptions,
): Promise<StaffAssessmentItem> {
  return api.patch<StaffAssessmentItem>(`/v1/staff/assessments/${seg(id)}`, body, opts)
}

/** DELETE /v1/staff/assessments/{id} — cancels the control (the row stays, so a dismissed EMIS suggestion stays dismissed). */
export function deleteStaffAssessment(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/staff/assessments/${seg(id)}`, opts)
}

// --- Admin ---

/** GET /v1/admin/assessments?from&to&subject_id&group_id&kind&status&source&undated — admin; every group. */
export function getAdminAssessments(
  params?: StaffAssessmentsParams,
  opts?: RequestOptions,
): Promise<StaffAssessmentList> {
  return api.get<StaffAssessmentList>("/v1/admin/assessments", { ...opts, query: params })
}
export const getAdminAssessmentsQuery = (params?: StaffAssessmentsParams) =>
  queryOptions({
    queryKey: keys.admin.assessments(params),
    queryFn: ({ signal }) => getAdminAssessments(params, { signal }),
  })

/** POST /v1/admin/assessments — admin. */
export function postAdminAssessment(body: AssessmentCreateBody, opts?: RequestOptions): Promise<StaffAssessmentItem> {
  return api.post<StaffAssessmentItem>("/v1/admin/assessments", body, opts)
}

/** PATCH /v1/admin/assessments/{id} — admin. */
export function patchAdminAssessment(
  id: string,
  body: AssessmentPatchBody,
  opts?: RequestOptions,
): Promise<StaffAssessmentItem> {
  return api.patch<StaffAssessmentItem>(`/v1/admin/assessments/${seg(id)}`, body, opts)
}

/** DELETE /v1/admin/assessments/{id} — admin; cancels the control. */
export function deleteAdminAssessment(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/admin/assessments/${seg(id)}`, opts)
}
