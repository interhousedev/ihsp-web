"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** Course sources the backend reports; labels come from the `courses.source.*` messages. */
export const COURSE_SOURCES = ["academic", "lms", "manual"] as const
export type CourseSource = (typeof COURSE_SOURCES)[number]

export type Course = {
  id: string | null
  source: CourseSource
  source_ref: string | null
  title: string
  provider: string | null
  level: string | null
  year: number | null
  grade: string | null
  included: boolean
}

export type ManualCourseInput = {
  title: string
  provider: string | null
  level: string | null
  year: number | null
  grade: string | null
}

export const COURSES_KEY = ["admission", "courses"] as const

/** GET /v1/admission/courses: lyceum subjects, LMS enrolments and manual rows, merged. */
export function useCourses() {
  return useQuery({
    queryKey: COURSES_KEY,
    queryFn: () => getApiClient().get<{ items: Course[] }>("/v1/admission/courses"),
  })
}

/** POST /courses (manual row) and PATCH /courses/{id} (include or exclude from the profile). */
export function useCourseMutations() {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: COURSES_KEY })
  const add = useMutation({
    mutationFn: (input: ManualCourseInput) => getApiClient().post<Course>("/v1/admission/courses", input),
    onSuccess: refresh,
  })
  const include = useMutation({
    mutationFn: ({ id, included }: { id: string; included: boolean }) =>
      getApiClient().patch<Course>(`/v1/admission/courses/${id}`, { included }),
    onSuccess: refresh,
  })
  return { add, include }
}

/** POST /courses/lms/{id}: one-click add of an LMS course to the profile (idempotent). */
export function useAddLmsCourse() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (lmsCourseId: string) =>
      getApiClient().post<Course>(`/v1/admission/courses/lms/${encodeURIComponent(lmsCourseId)}`, {}),
    onSuccess: () => client.invalidateQueries({ queryKey: COURSES_KEY }),
  })
}

export type LmsCatalogCard = {
  id: string
  title: string
  summary: string | null
  cover_url: string | null
  locked: boolean
}

/** GET /v1/lms/courses: published LMS catalog, filtered by title. */
export function useLmsCatalog(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admission", "lms-catalog", query] as const,
    enabled,
    queryFn: ({ signal }) =>
      getApiClient().get<LmsCatalogCard[]>("/v1/lms/courses", { query: query ? { query } : {}, signal }),
  })
}

/** Enrols the student when needed (POST /v1/lms/courses/{id}/enroll), then stores the course on the profile. */
export function useEnrollAndAddLmsCourse() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, enrolled }: { id: string; enrolled: boolean }) => {
      const api = getApiClient()
      if (!enrolled) await api.post(`/v1/lms/courses/${encodeURIComponent(id)}/enroll`, {})
      const course = await api.post<Course>(`/v1/admission/courses/lms/${encodeURIComponent(id)}`, {})
      // The add is idempotent and returns an excluded row unchanged: put it back on the profile.
      if (!course.included && course.id)
        return api.patch<Course>(`/v1/admission/courses/${course.id}`, { included: true })
      return course
    },
    onSuccess: () => client.invalidateQueries({ queryKey: COURSES_KEY }),
  })
}
