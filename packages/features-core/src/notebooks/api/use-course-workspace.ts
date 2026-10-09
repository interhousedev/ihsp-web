"use client"

import {
  getCourseStepsQuery,
  keys,
  postApplyArtifact,
  postApplyPreview,
  postCourseWorkspace,
  type ApplyBody,
  type ApplyPreview,
  type ApplyResult,
  type CourseWorkspace,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

/** Get-or-create the workspace notebook of a course (creating needs the `edit` permission). */
export function useOpenCourseWorkspace() {
  return useMutation<CourseWorkspace, unknown, string>({
    mutationFn: (courseId) => postCourseWorkspace({ course_id: courseId }),
  })
}

/** The draft outline of the workspace's course (picker of course steps and Apply targets). */
export function useCourseSteps(notebookId: string | null) {
  return useQuery({ ...getCourseStepsQuery(notebookId ?? ""), enabled: notebookId !== null && notebookId !== "" })
}

/** What Apply would change; nothing is written. A fresh preview is requested whenever the body changes. */
export function useApplyPreview(notebookId: string, artifactId: string) {
  return useMutation<ApplyPreview, unknown, ApplyBody>({
    mutationFn: (body) => postApplyPreview(notebookId, artifactId, body),
  })
}

/** The LMS queries of a course draft: the editor refreshes them after anything wrote into the draft. */
export function invalidateCourseDraft(queryClient: QueryClient, courseId: string | null): Promise<void> {
  if (courseId === null) return queryClient.invalidateQueries({ queryKey: keys.lms.all() })
  return queryClient.invalidateQueries({ queryKey: ["lms", "course", courseId] }).then(() => {
    // Step drafts are keyed by the step id only.
    return queryClient.invalidateQueries({ queryKey: ["lms", "steps"] })
  })
}

/** Writes the output into the course draft, then refreshes the draft queries of the editor. */
export function useApplyArtifact(notebookId: string, artifactId: string, courseId: string | null) {
  const queryClient = useQueryClient()
  return useMutation<ApplyResult, unknown, ApplyBody>({
    mutationFn: (body) => postApplyArtifact(notebookId, artifactId, body),
    onSuccess: () => {
      void invalidateCourseDraft(queryClient, courseId)
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.courseSteps(notebookId) })
    },
  })
}
