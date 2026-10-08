"use client"

import { getLmsCourseDraftQuery, getLmsCourseQuery, type OutlineSection } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

export type StepOutline = { outline: OutlineSection[] | null; courseTitle: string | null; slug: string | null }

/**
 * The outline around the open step, for the previous and next links: the live outline of the course page, or the draft
 * outline in preview. Failing to load it only hides the links.
 */
export function useStepOutline({
  courseId,
  slug,
  preview,
}: {
  courseId: string
  slug: string | null
  preview: boolean
}): StepOutline {
  const course = useQuery({ ...getLmsCourseQuery(slug ?? courseId), enabled: !preview, retry: false })
  const draft = useQuery({ ...getLmsCourseDraftQuery(courseId), enabled: preview, retry: false })
  if (preview)
    return {
      outline: draft.data?.outline ?? null,
      courseTitle: draft.data?.title ?? null,
      slug: draft.data?.slug ?? slug,
    }
  return {
    outline: course.data?.outline ?? null,
    courseTitle: course.data?.title ?? null,
    slug: course.data?.slug ?? slug,
  }
}
