import type { CoursePage } from "@ihsp/api"

/** "Course progress" of the sidebar: points when the course has tests, otherwise completed lessons. */
export type CourseProgress =
  | { kind: "points"; earned: number; total: number; percent: number }
  | { kind: "lessons"; done: number; total: number; percent: number }

function ratio(part: number, total: number): number {
  return total > 0 ? Math.min(100, Math.max(0, Math.round((part / total) * 100))) : 0
}

/** `null` when the viewer is not enrolled (staff reading a course): there is nothing to show. */
export function courseProgress(course: CoursePage | null | undefined): CourseProgress | null {
  if (!course?.enrolled) return null
  if (course.points_total > 0) {
    const earned = course.points_earned ?? 0
    return { kind: "points", earned, total: course.points_total, percent: ratio(earned, course.points_total) }
  }
  const done = course.steps_completed ?? 0
  return { kind: "lessons", done, total: course.steps_count, percent: ratio(done, course.steps_count) }
}

/** Points without float noise: whole numbers stay whole, others get at most two decimals. */
export function formatPoints(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
}
