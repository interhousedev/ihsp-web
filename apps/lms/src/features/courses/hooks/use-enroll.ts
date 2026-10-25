"use client"

import { keys, postLmsCourseEnroll, type CoursePage } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"

/** Enrolls in a public course; the answer is the course page with `enrolled: true`. */
export function useEnroll(slug: string) {
  const queryClient = useQueryClient()
  return useMutation<CoursePage, unknown, string>({
    mutationFn: (courseId) => postLmsCourseEnroll(courseId),
    onSuccess: (page) => {
      queryClient.setQueryData(keys.lms.course(slug), page)
      void queryClient.invalidateQueries({ queryKey: keys.lms.myCourses() })
    },
  })
}
