"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type CaseloadFilters = {
  stage?: string | null
  risk?: boolean
  deadline_before?: string | null
  group_id?: string | null
}

export type CaseloadItem = {
  student_id: string
  student_name: string | null
  group_id: string | null
  group_name: string | null
  stage: string | null
  next_due: string | null
  overdue: number
  open_help: number
  limited: boolean
}

export type SavedView = {
  id: string
  name: string
  filters: CaseloadFilters
  sort: string | null
  is_default: boolean
  lock_version: number
}

export type SavedViewInput = { name: string; filters: CaseloadFilters; sort?: string | null; is_default?: boolean }

export type Assignment = {
  id: string
  user_id: string
  staff_role_id: string
  scope_kind: string
  scope_ref: string | null
  starts_at: string
  expires_at: string | null
}

export type AssignmentInput = {
  user_id: string
  staff_role_id: string
  scope_kind: string
  scope_ref: string
  expires_at?: string | null
}

export type StudentProfile = {
  student_id: string
  account_kind: string
  stage: string
  answers: Record<string, unknown>
  missing_required: string[]
  setup_completed: boolean
}
export type StudentWords = {
  words: unknown[]
  candidates: unknown[]
  source: string
  version: number
  confirmed_at: string | null
}
export type StudentAlignment = {
  overall: string | null
  grades: Record<string, unknown>
  safety_flag: string
  message_key: string | null
  stale: boolean
  created_at: string | null
}
export type StudentCourse = {
  id: string | null
  title: string
  provider: string | null
  level: string | null
  year: number | null
  grade: string | null
  included: boolean
}

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

export type StudentSection = "profile" | "words" | "alignment" | "courses" | "list"

type SectionData = {
  profile: StudentProfile
  words: StudentWords
  alignment: StudentAlignment
  courses: { items: StudentCourse[] }
  list: { items?: Record<string, unknown>[] } & Record<string, unknown>
}

/** GET /v1/admission/students/{id}/{section}; a tab asks only for its own section. */
export function useStudentSection<S extends StudentSection>(studentId: string, section: S) {
  return useQuery({
    queryKey: staffKeys.student(studentId, section),
    queryFn: () => getApiClient().get<SectionData[S]>(`/v1/admission/students/${studentId}/${section}`),
    enabled: studentId !== "",
  })
}
