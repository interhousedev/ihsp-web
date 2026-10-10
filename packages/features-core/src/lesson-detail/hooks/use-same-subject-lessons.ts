"use client"

import { getStaffTimetableQuery, type LessonItem } from "@ihsp/api"
import { addDays, startOfWeek } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"

/**
 * Other lessons of the same subject in the lesson's week (not cancelled), the choices of "Also add to" (STF-5): the
 * same material for 2TN1 and 2TN2. Same-day lessons come first.
 */
export function useSameSubjectLessons(
  lesson: LessonItem,
  enabled: boolean,
): { lessons: LessonItem[]; isPending: boolean } {
  const monday = startOfWeek(lesson.date)
  const query = useQuery({
    ...getStaffTimetableQuery({ from: monday, to: addDays(monday, 4) }),
    enabled,
  })
  const lessons = (query.data ?? [])
    .filter((item) => item.id !== lesson.id && item.subject.id === lesson.subject.id && item.status !== "cancelled")
    .toSorted(
      (a, b) =>
        Number(b.date === lesson.date) - Number(a.date === lesson.date) || a.starts_at.localeCompare(b.starts_at),
    )
  return { lessons, isPending: enabled && query.isPending }
}
