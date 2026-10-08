import type { LessonItem } from "@ihsp/api"

type Timed = Pick<LessonItem, "starts_at" | "ends_at" | "status">

/** The lesson in progress at `now` (milliseconds), if it is not cancelled. */
export function isLessonNow(lesson: Timed, now: number): boolean {
  return lesson.status !== "cancelled" && Date.parse(lesson.starts_at) <= now && now < Date.parse(lesson.ends_at)
}

/** A lesson that has ended and still has no attendance: the teacher gets a warning (STF-3). */
export function isAttendanceMissing(
  lesson: Pick<LessonItem, "ends_at" | "status" | "attendance_submitted">,
  now: number,
): boolean {
  return lesson.status !== "cancelled" && !lesson.attendance_submitted && Date.parse(lesson.ends_at) < now
}

/** Link to the lesson page; `hash` jumps to a section (`attendance`, `homework`, `materials`). */
export function lessonHref(id: string, hash?: "attendance" | "homework" | "materials", add?: "material"): string {
  const query = add ? `?id=${encodeURIComponent(id)}&add=${add}` : `?id=${encodeURIComponent(id)}`
  return `/lessons/view/${query}${hash ? `#${hash}` : ""}`
}
