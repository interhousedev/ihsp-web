"use client"

import { useSession } from "@ihsp/auth"
import {
  getLmsCourseLandingQuery,
  getLmsCourseQuery,
  getLmsCoursesQuery,
  getLmsCourseStepQuery,
  getPublicLmsCourseLandingQuery,
  getPublicLmsCourseQuery,
  getPublicLmsCoursesQuery,
  getPublicLmsCourseStepQuery,
} from "@ihsp/api"

/** Nobody is signed in (the session is known and empty): the pages read the public endpoints and hide personal parts. */
export function useGuest(): boolean {
  return useSession().status === "anonymous"
}

/** The query options of each read, by who looks: a guest reads the public endpoints, a signed-in user the personal ones. */
export const reads = {
  courses: (guest: boolean, query: string) =>
    guest ? getPublicLmsCoursesQuery(query ? { query } : undefined) : getLmsCoursesQuery(query ? { query } : undefined),
  course: (guest: boolean, ref: string) => (guest ? getPublicLmsCourseQuery(ref) : getLmsCourseQuery(ref)),
  landing: (guest: boolean, slug: string, preview = false) =>
    guest ? getPublicLmsCourseLandingQuery(slug) : getLmsCourseLandingQuery(slug, preview),
  step: (guest: boolean, courseId: string, stepId: string) =>
    guest ? getPublicLmsCourseStepQuery(courseId, stepId) : getLmsCourseStepQuery(courseId, stepId),
}
