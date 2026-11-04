"use client"

import { keys, lmsLandingKey, postLmsCourseEnroll, type CoursePage } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/**
 * Enrolls in a public course; the answer is the course page with `enrolled: true`. Every view of the enrolment is
 * refreshed: the course page, both landing variants, every catalog list (cards read `progress_pct`) and My courses.
 */
export function useEnroll(slug: string) {
  const queryClient = useQueryClient()
  return useMutation<CoursePage, unknown, string>({
    mutationFn: (courseId) => postLmsCourseEnroll(courseId),
    onSuccess: (page) => {
      queryClient.setQueryData(keys.lms.course(slug), page)
      void queryClient.invalidateQueries({ queryKey: lmsLandingKey(slug, false) })
      void queryClient.invalidateQueries({ queryKey: lmsLandingKey(slug, true) })
      void queryClient.invalidateQueries({ queryKey: ["lms", "courses"] })
      void queryClient.invalidateQueries({ queryKey: keys.lms.myCourses() })
    },
  })
}
