import type { LessonItem } from "@ihsp/api"

/** Minutes of the day of an ISO instant in Asia/Tashkent (UTC+5, no daylight saving). */
export function tashkentMinutes(iso: string): number {
  const date = new Date(iso)
  return ((date.getUTCHours() + 5) % 24) * 60 + date.getUTCMinutes()
}

/** The lesson in progress at `now`, if any. */
export function isLessonNow(lesson: Pick<LessonItem, "starts_at" | "ends_at" | "status">, now: number): boolean {
  return lesson.status !== "cancelled" && Date.parse(lesson.starts_at) <= now && now < Date.parse(lesson.ends_at)
}
