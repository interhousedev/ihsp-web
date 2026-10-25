/** Looks up demo data through the API of a signed-in page, so specs do not hard-code ids that the seed generates. */

import type { LessonItem, PersonRef } from "@ihsp/api"
import type { Page } from "@playwright/test"
import { api, tashkentDate } from "./api"

/** Login of a teacher by the seed rule `<surname>.<name>` (lower case, no spaces). */
export function teacherLoginOf(person: PersonRef): string {
  return `${loginPart(person.last_name)}.${loginPart(person.first_name)}`
}

function loginPart(value: string): string {
  return value.toLowerCase().replaceAll(/\s+/g, "")
}

/** Lessons of the signed-in student between two days (offsets from today), oldest first, cancelled ones left out. */
export async function studentLessons(page: Page, fromOffset: number, toOffset: number): Promise<LessonItem[]> {
  const lessons = await api<LessonItem[]>(
    page,
    "GET",
    `/v1/me/timetable?from=${tashkentDate(fromOffset)}&to=${tashkentDate(toOffset)}`,
  )
  return lessons
    .filter((lesson) => lesson.status === "scheduled")
    .toSorted((a, b) => a.starts_at.localeCompare(b.starts_at))
}

/** Lessons of the signed-in teacher between two days (offsets from today), oldest first, cancelled ones left out. */
export async function teacherLessons(page: Page, fromOffset: number, toOffset: number): Promise<LessonItem[]> {
  const lessons = await api<LessonItem[]>(
    page,
    "GET",
    `/v1/staff/timetable?from=${tashkentDate(fromOffset)}&to=${tashkentDate(toOffset)}`,
  )
  return lessons
    .filter((lesson) => lesson.status === "scheduled")
    .toSorted((a, b) => a.starts_at.localeCompare(b.starts_at))
}

/** A fresh text for data a spec creates, so that leftovers of failed runs never collide. */
export function unique(prefix: string): string {
  return `${prefix} ${new Date().toISOString().slice(11, 19)}-${Math.floor(Math.random() * 1000)}`
}
