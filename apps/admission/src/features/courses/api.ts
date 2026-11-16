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
