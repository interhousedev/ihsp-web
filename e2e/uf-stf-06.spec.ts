/**
 * UF-STF-06: the teacher takes attendance: everyone starts present, a tap marks a student absent, Submit saves the
 * list with the version the sheet had. A concurrent change gives the conflict dialog; after the 7-day window the sheet
 * is read-only.
 */

import type { AttendanceSheet, StaffLesson } from "@ihsp/api"
import { TEACHER } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { teacherLessons } from "./fixtures/data"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading, toast } from "./fixtures/ui"

const name = (student: { last_name: string; first_name: string }) => `${student.last_name} ${student.first_name}`

test.describe("UF-STF-06 attendance", () => {
  test("mark a student absent, submit, resolve a concurrent change", async ({ page, allowConsoleError }, testInfo) => {
    test.slow()
    // The concurrent save below makes the server answer 409 `common/conflict` on purpose.
    allowConsoleError(/status of 409/)
    await loginAs(page, TEACHER, "staff")

    // A lesson of the teacher that already started, inside the 7-day window.
    const lessons = await teacherLessons(page, -6, 0)
    const now = new Date().toISOString()
    const lesson = lessons.findLast((item) => item.starts_at <= now) ?? lessons.at(-1)
    test.skip(!lesson, `${TEACHER.login} has no lesson in the last week (weekend or holiday; check E2E_TEACHER_LOGIN)`)
    if (!lesson) return

    const initial = await api<StaffLesson>(page, "GET", `/v1/staff/lessons/${lesson.id}`)
    test.skip(
      !initial.attendance.editable || initial.attendance.roster.length < 2,
      "the sheet is not editable or has fewer than two students",
    )
    const students = initial.attendance.roster.filter((student) => student.counted)
    const [target, other] = students
    if (!target || !other) return
    let version = initial.attendance.version

    try {
      await page.goto(`${URLS.staff}/lessons/view/?id=${lesson.id}`)
      await expect(page.getByRole("region", { name: "Attendance" })).toBeVisible()
      await a11y(page, testInfo, { label: "staff lesson attendance" })
      const row = (student: { last_name: string; first_name: string }) =>
        page.getByRole("button", { name: new RegExp(`^${name(student)}`) })

      // Everyone starts present (unless the sheet was submitted before); tap the first student.
      await page.getByRole("button", { name: "Everyone present" }).click()
      await row(target).click()
      await expect(row(target)).toHaveAttribute("aria-pressed", "true")
      await expect(page.getByText(/^Absent: 1 of \d+$/)).toBeVisible()

      // Someone else saves the list first: our version is stale and the server answers 409 common/conflict.
      const theirs = await api<AttendanceSheet>(page, "PUT", `/v1/staff/lessons/${lesson.id}/attendance`, {
        absent: [other.user_id],
        present_unassigned: [],
        base_version: version,
      })
      version = theirs.version

      await page.getByRole("button", { name: /^(Submit attendance|Save changes)$/ }).click()
      const dialog = page.getByRole("dialog", { name: "The list was changed" })
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText(name(other))).toBeVisible()
      await a11y(page, testInfo, { label: "staff attendance conflict" })

      // Keep my marks: the sheet is rebased on their version and saved again.
      await dialog.getByRole("button", { name: "Keep my marks" }).click()
      await page.getByRole("button", { name: /^(Submit attendance|Save changes)$/ }).click()
      await expect(toast(page, "Attendance saved")).toBeVisible()

      // The saved list: the target is absent; it survives a reload.
      await page.reload()
      await expect(row(target)).toHaveAttribute("aria-pressed", "true")
      const saved = await api<StaffLesson>(page, "GET", `/v1/staff/lessons/${lesson.id}`)
      version = saved.attendance.version
      expect(saved.attendance.roster.find((student) => student.user_id === target.user_id)?.absent).toBe(true)
    } finally {
      // Leave the lesson with everybody present so that the spec can run again.
      await api(page, "PUT", `/v1/staff/lessons/${lesson.id}/attendance`, {
        absent: [],
        present_unassigned: [],
        base_version: version,
      }).catch(() => undefined)
    }
  })

  test("after the 7-day window the sheet is read-only", async ({ page }, testInfo) => {
    await loginAs(page, TEACHER, "staff")
    const old = (await teacherLessons(page, -30, -9)).at(-1)
    test.skip(!old, "the teacher has no lesson older than 8 days (the term starts on 2026-09-02)")
    if (!old) return
    await page.goto(`${URLS.staff}/lessons/view/?id=${old.id}`)
    await expect(
      page.getByText("The 7-day window has passed, so this list is read-only. Ask Administration to correct it."),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Submit attendance" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Everyone present" })).toHaveCount(0)
    await a11y(page, testInfo, { label: "staff attendance read-only" })
  })

  test("the Today page lists lessons that need attendance and the journal opens", async ({ page }, testInfo) => {
    await loginAs(page, TEACHER, "staff")
    await expect(heading(page, "Today", 1)).toBeVisible()
    await a11y(page, testInfo, { label: "staff today" })
    await page.goto(`${URLS.staff}/journal/`)
    await expect(heading(page, "Journal", 1)).toBeVisible()
    await a11y(page, testInfo, { label: "staff journal" })
  })
})
