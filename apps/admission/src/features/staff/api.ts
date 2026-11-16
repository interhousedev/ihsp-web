"use client"

import {
  type AdmissionAssignment,
  type AdmissionAssignmentIn,
  type AdmissionCaseloadItem,
  type AdmissionListEntry,
  type AdmissionStudentAlignment,
  type AdmissionStudentCourse,
  type AdmissionStudentProfile,
  type AdmissionStudentWords,
  getApiClient,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type CaseloadFilters = {
  stage?: string | null
  risk?: boolean
  deadline_before?: string | null
  group_id?: string | null
}

export type CaseloadItem = AdmissionCaseloadItem

export type SavedView = {
  id: string
  name: string
  filters: CaseloadFilters
  sort: string | null
  is_default: boolean
  lock_version: number
}

export type SavedViewInput = { name: string; filters: CaseloadFilters; sort?: string | null; is_default?: boolean }

export type Assignment = AdmissionAssignment

export type AssignmentInput = AdmissionAssignmentIn

export type StudentProfile = AdmissionStudentProfile
export type StudentWords = AdmissionStudentWords
export type StudentAlignment = AdmissionStudentAlignment
export type StudentCourse = AdmissionStudentCourse

export type StudentListEntry = AdmissionListEntry

export const staffKeys = {
  caseload: (filters: CaseloadFilters) => ["admission", "staff", "caseload", filters] as const,
  views: ["admission", "staff", "saved-views"] as const,
  student: (id: string, section: string) => ["admission", "staff", "student", id, section] as const,
}

/** Only the filters that are set go into the query string. */
export function caseloadQuery(filters: CaseloadFilters): Record<string, string | boolean> {
  const query: Record<string, string | boolean> = {}
  if (filters.stage) query.stage = filters.stage
  if (filters.risk) query.risk = true
  if (filters.deadline_before) query.deadline_before = filters.deadline_before
  if (filters.group_id) query.group_id = filters.group_id
  return query
}

/** GET /v1/admission/staff/students. */
export function useCaseload(filters: CaseloadFilters) {
  return useQuery({
    queryKey: staffKeys.caseload(filters),
    queryFn: () =>
      getApiClient().get<{ items: CaseloadItem[] }>("/v1/admission/staff/students", { query: caseloadQuery(filters) }),
  })
}

export function useSavedViews() {
  return useQuery({
    queryKey: staffKeys.views,
    queryFn: () => getApiClient().get<{ items: SavedView[] }>("/v1/admission/staff/saved-views"),
  })
}

/** POST / DELETE /v1/admission/staff/saved-views. */
export function useSavedViewMutations() {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: staffKeys.views })
  const create = useMutation({
    mutationFn: (input: SavedViewInput) => getApiClient().post<SavedView>("/v1/admission/staff/saved-views", input),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`/v1/admission/staff/saved-views/${id}`),
    onSuccess: refresh,
  })
  return { create, remove }
}

/** POST / DELETE /v1/admission/staff/assignments (needs the `students:assign` permission). */
export function useAssignmentMutations() {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: ["admission", "staff"] })
  const assign = useMutation({
    mutationFn: (input: AssignmentInput) => getApiClient().post<Assignment>("/v1/admission/staff/assignments", input),
    onSuccess: refresh,
  })
  const unassign = useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`/v1/admission/staff/assignments/${id}`),
    onSuccess: refresh,
  })
  return { assign, unassign }
}

export type CoveringOfficer = {
  assignment_id: string
  user_id: string
  name: string | null
  login: string | null
  starts_at: string
  expires_at: string | null
}

const COVER_PATH = "/v1/admission/staff/all-students-officers"

/** GET /v1/admission/staff/all-students-officers (admin only). */
export function useCoveringOfficers(enabled: boolean) {
  return useQuery({
    queryKey: ["admission", "staff", "covering-officers"],
    enabled,
    queryFn: ({ signal }) => getApiClient().get<{ items: CoveringOfficer[] }>(COVER_PATH, { signal }),
  })
}

/** GET .../all-students-officers/candidates: active transcript officers by name. */
export function useOfficerCandidates(q: string, enabled: boolean) {
  const term = q.trim()
  return useQuery({
    queryKey: ["admission", "staff", "officer-candidates", term],
    enabled: enabled && term.length >= ASSIGNABLE_SEARCH_MIN,
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: AssignableUser[] }>(`${COVER_PATH}/candidates`, { query: { q: term }, signal }),
  })
}

/** POST / DELETE .../all-students-officers: grant or revoke "covers all students". */
export function useCoverMutations() {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: ["admission", "staff", "covering-officers"] })
  const grant = useMutation({
    mutationFn: (userId: string) => getApiClient().post<CoveringOfficer>(COVER_PATH, { user_id: userId }),
    onSuccess: refresh,
  })
  const revoke = useMutation({
    mutationFn: (assignmentId: string) => getApiClient().delete<void>(`${COVER_PATH}/${assignmentId}`),
    onSuccess: refresh,
  })
  return { grant, revoke }
}

export type AssignableUser = { user_id: string; name: string; login: string | null; kinds: string[] }
export type AssignableRole = { id: string; kind: string; name: string; name_i18n: Record<string, string> }

export const ASSIGNABLE_SEARCH_MIN = 2

/** GET /v1/admission/staff/assignable-users: active counselors, mentors and officers by name. */
export function useAssignableUsers(studentId: string, q: string, enabled: boolean) {
  const term = q.trim()
  return useQuery({
    queryKey: ["admission", "staff", "assignable-users", studentId, term],
    enabled: enabled && term.length >= ASSIGNABLE_SEARCH_MIN,
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: AssignableUser[] }>("/v1/admission/staff/assignable-users", {
        query: { student_id: studentId, q: term },
        signal,
      }),
  })
}

/** GET /v1/admission/staff/assignable-roles: the sub-roles the caller may delegate. */
export function useAssignableRoles(studentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admission", "staff", "assignable-roles", studentId],
    enabled,
    queryFn: () =>
      getApiClient().get<{ items: AssignableRole[] }>("/v1/admission/staff/assignable-roles", {
        query: { student_id: studentId },
      }),
  })
}

export type StudentSection = "profile" | "words" | "alignment" | "courses" | "list"

type SectionData = {
  profile: StudentProfile
  words: StudentWords
  alignment: StudentAlignment
  courses: { items: StudentCourse[] }
  list: StudentListEntry[]
}

/** GET /v1/admission/students/{id}/{section}; a tab asks only for its own section. */
export function useStudentSection<S extends StudentSection>(studentId: string, section: S) {
  return useQuery({
    queryKey: staffKeys.student(studentId, section),
    queryFn: () => getApiClient().get<SectionData[S]>(`/v1/admission/students/${studentId}/${section}`),
    enabled: studentId !== "",
  })
}
