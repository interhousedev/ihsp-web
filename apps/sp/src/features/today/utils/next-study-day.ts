import { addDays } from "@ihsp/i18n"

type LessonState = "done" | "now" | "next" | "later" | "cancelled"

/** Whether today has nothing left to attend: no lessons (weekend, holiday) or all done or cancelled. */
export function todayIsOver(lessons: readonly { state: LessonState }[]): boolean {
  return lessons.every((lesson) => lesson.state === "done" || lesson.state === "cancelled")
}

/** The next study day: the one the server names, otherwise the next Monday-to-Friday day after `today`. */
export function nextStudyDay(serverDay: string | null, today: string): string {
  if (serverDay) return serverDay
  let day = addDays(today, 1)
  while ([0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay())) day = addDays(day, 1)
  return day
}
