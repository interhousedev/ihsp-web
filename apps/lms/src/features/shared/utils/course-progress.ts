import type { CoursePage } from "@ihsp/api"

/** "Course progress": completed lessons drive the bar; points (when the course has tests) are shown next to it. */
export type CourseProgress = {
  done: number
  total: number
  percent: number
  points: { earned: number; total: number } | null
}

function ratio(part: number, total: number): number {
  return total > 0 ? Math.min(100, Math.max(0, Math.round((part / total) * 100))) : 0
}

/** `null` when the viewer is not enrolled (staff reading a course): there is nothing to show. */
export function courseProgress(course: CoursePage | null | undefined): CourseProgress | null {
  if (!course?.enrolled) return null
  const done = course.steps_completed ?? 0
  return {
    done,
    total: course.steps_count,
    percent: ratio(done, course.steps_count),
    points: course.points_total > 0 ? { earned: course.points_earned ?? 0, total: course.points_total } : null,
  }
}

/** Points without float noise: whole numbers stay whole, others get at most two decimals. */
export function formatPoints(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
}
