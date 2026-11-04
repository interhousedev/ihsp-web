"use client"

import {
  getLmsCourseDraftQuery,
  getLmsCourseQuery,
  getLmsMyCoursesQuery,
  type CoursePage,
  type OutlineSection,
} from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

export type StepOutline = {
  outline: OutlineSection[] | null
  courseTitle: string | null
  slug: string | null
  /** The live course page (progress, points, can_edit); `null` in a preview or while it loads. */
  course: CoursePage | null
  /** The course outline is still loading or could not be loaded. */
  unavailable: boolean
}

/**
 * The outline around the open step, for the sidebar and the lesson links: the live course page, or the draft outline
 * in preview. Failing to load it only empties the sidebar; the lesson itself still opens.
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
  // The course page is served by slug only and the player's address has the id: the student's courses map one to the other.
  const mine = useQuery({ ...getLmsMyCoursesQuery(), enabled: !preview && slug === null, retry: false })
  const known =
    slug ?? [...(mine.data?.enrolled ?? []), ...(mine.data?.managed ?? [])].find((item) => item.id === courseId)?.slug
  const course = useQuery({
    ...getLmsCourseQuery(known ?? courseId),
    enabled: !preview && (known !== undefined || !mine.isPending),
    retry: false,
  })
  const draft = useQuery({ ...getLmsCourseDraftQuery(courseId), enabled: preview, retry: false })
  if (preview)
    return {
      outline: draft.data?.outline ?? null,
      courseTitle: draft.data?.title ?? null,
      slug: draft.data?.slug ?? slug,
      course: null,
      unavailable: draft.isError,
    }
  return {
    outline: course.data?.outline ?? null,
    courseTitle: course.data?.title ?? null,
    slug: course.data?.slug ?? slug,
    course: course.data ?? null,
    unavailable: course.isError,
  }
}
