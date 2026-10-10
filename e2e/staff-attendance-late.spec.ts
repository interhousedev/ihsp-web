/**
 * Staff attendance with three states: Present, Late and Absent are one radio group per student; the footer counts
 * them and Submit saves. The lesson is restored to everybody present afterwards.
 */

import type { StaffLesson } from "@ihsp/api"
import { TEACHER } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { teacherLessons } from "./fixtures/data"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { expect, test } from "./fixtures/test"
import { toast } from "./fixtures/ui"

test("attendance: mark a student late and another absent", async ({ page }) => {
  test.slow()
  await loginAs(page, TEACHER, "staff")
  const lessons = await teacherLessons(page, -6, 0)
  const now = new Date().toISOString()
  const lesson = lessons.findLast((item) => item.starts_at <= now) ?? lessons.at(-1)
  test.skip(!lesson, "the teacher has no lesson in the last week")
  if (!lesson) return
  const initial = await api<StaffLesson>(page, "GET", `/v1/staff/lessons/${lesson.id}`)
  const [a, b] = initial.attendance.roster.filter((student) => student.counted)
  test.skip(!initial.attendance.editable || !a || !b, "the sheet is not editable or has fewer than two students")
  if (!a || !b) return
  let version = initial.attendance.version

  try {
    await page.goto(`${URLS.staff}/lessons/view/?id=${lesson.id}`)
    await expect(page.getByRole("region", { name: "Attendance" })).toBeVisible()
    await page.getByRole("button", { name: "Everyone present" }).click()
    const group = (s: { last_name: string; first_name: string }) =>
      page.getByRole("radiogroup", { name: new RegExp(`${s.last_name}`) }).filter({ hasText: s.first_name }).first()

    await group(a).getByRole("radio", { name: "Late" }).click()
    await expect(group(a).getByRole("radio", { name: "Late" })).toHaveAttribute("aria-checked", "true")
    await group(b).getByRole("radio", { name: "Absent" }).click()
    await expect(group(b).getByRole("radio", { name: "Absent" })).toHaveAttribute("aria-checked", "true")
    await expect(page.getByText(/1 late/)).toBeVisible()
    await expect(page.getByText(/1 absent/)).toBeVisible()
    await group(a).getByRole("radio", { name: "Present" }).click()
    await expect(page.getByText(/1 late/)).toHaveCount(0)
    await group(a).getByRole("radio", { name: "Late" }).click()

    await page.getByRole("button", { name: /^(Submit attendance|Save changes)$/ }).click()
    await expect(toast(page, "Attendance saved")).toBeVisible()
    const saved = await api<StaffLesson>(page, "GET", `/v1/staff/lessons/${lesson.id}`)
    version = saved.attendance.version
    const row = (id: string) => saved.attendance.roster.find((s) => s.user_id === id)
    expect(row(a.user_id)?.late).toBe(true)
    expect(row(b.user_id)?.absent).toBe(true)
  } finally {
    await api(page, "PUT", `/v1/staff/lessons/${lesson.id}/attendance`, {
      absent: [],
      late: [],
      present_unassigned: [],
      base_version: version,
    }).catch(() => undefined)
  }
})
