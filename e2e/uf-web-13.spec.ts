/**
 * UF-WEB-13: homework. The teacher gives homework (API, as the teacher's page would); the student ticks it and the
 * item moves to Done; a private note is saved. Everything is restored at the end so the spec can run again.
 */

import { STUDENT, TEACHER } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { studentLessons, teacherLoginOf, unique } from "./fixtures/data"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading } from "./fixtures/ui"

test("UF-WEB-13 tick homework, move it to Done, keep a private note", async ({ page, newGuardedContext }, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")

  // The teacher of one of the student's recent lessons gives homework for it.
  const lessons = await studentLessons(page, -6, 0)
  const lesson = lessons.findLast((item) => item.teacher !== null)
  test.skip(!lesson?.teacher, "the student has no lesson with a teacher in the last week (weekend or holiday)")
  if (!lesson?.teacher) return
  const teacherContext = await newGuardedContext()
  const teacherPage = await teacherContext.newPage()
  await loginAs(teacherPage, { ...TEACHER, login: teacherLoginOf(lesson.teacher) }, "staff")
  const text = unique("E2E homework")
  const resetStudentState = async () => {
    // The tick and the note belong to the student and outlive the teacher's homework text: clear leftovers of earlier runs.
    await api(page, "PUT", `/v1/me/homework/${lesson.id}/done`, { done: false }).catch(() => undefined)
    await api(page, "PUT", `/v1/me/homework/${lesson.id}/note`, { note: null }).catch(() => undefined)
  }
  await api(teacherPage, "PUT", `/v1/staff/lessons/${lesson.id}/homework`, { text })
  await resetStudentState() // only possible while the lesson has homework

  try {
    await page.goto(`${URLS.sp}/homework/`)
    await expect(heading(page, "Homework", 1)).toBeVisible()

    // The item is under Upcoming, Later or Done depending on its due date; look through the tabs.
    const item = page.getByTestId("homework-item").filter({ hasText: text })
    for (const tab of ["Upcoming", "Later"]) {
      await page.getByRole("tab", { name: tab }).click()
      const found = await item.waitFor({ state: "visible", timeout: 5_000 }).then(
        () => true,
        () => false,
      )
      if (found) break
    }
    await expect(item).toBeVisible()
    await a11y(page, testInfo, { label: "sp homework" })

    // Tick: the item leaves this tab and appears under Done.
    await item.getByRole("checkbox", { name: /^Done: / }).click()
    await expect(item).toHaveCount(0)
    await page.getByRole("tab", { name: "Done" }).click()
    const done = page.getByTestId("homework-item").filter({ hasText: text })
    await expect(done).toBeVisible()
    await expect(done).toHaveAttribute("data-done", "true")

    // A private note.
    const note = `Pages 34-36 ${Date.now()}`
    await done.getByRole("button", { name: "Add note" }).click()
    await done.getByLabel("Private note").fill(note)
    const saved = page.waitForResponse(
      (response) => response.url().includes("/note") && response.request().method() === "PUT",
    )
    await done.getByRole("button", { name: "Save", exact: true }).click()
    expect((await saved).ok()).toBe(true)
    await expect(done.getByText(note)).toBeVisible()

    // Both survive a reload.
    await page.reload()
    await page.getByRole("tab", { name: "Done" }).click()
    const afterReload = page.getByTestId("homework-item").filter({ hasText: text })
    await expect(afterReload).toBeVisible()
    await expect(afterReload.getByText(note)).toBeVisible()

    // Untick again.
    await afterReload.getByRole("checkbox", { name: /^Done: / }).click()
    await expect(afterReload).toHaveCount(0)
  } finally {
    await resetStudentState()
    await api(teacherPage, "DELETE", `/v1/staff/lessons/${lesson.id}/homework`).catch(() => undefined)
  }
})
