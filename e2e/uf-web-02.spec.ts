/** UF-WEB-02: the student opens the app and sees Today: lessons of the day, due homework, marks, the semester. */

import type { StudentToday } from "@ihsp/api"
import { STUDENT } from "./fixtures/accounts"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading } from "./fixtures/ui"

test.describe("UF-WEB-02 Today", () => {
  test("Today shows the cards from the data the API returned", async ({ page }, testInfo) => {
    const todayResponse = page.waitForResponse(
      (response) => response.url().startsWith(`${URLS.api}/v1/me/today`) && response.ok(),
    )
    await loginAs(page, STUDENT, "sp")
    const today = (await (await todayResponse).json()) as StudentToday

    await expect(heading(page, "Today", 1)).toBeVisible()

    // Navigation: the sidebar on desktop, the bottom bar on a phone.
    if (testInfo.project.name === "mobile") {
      await expect(page.getByRole("navigation", { name: "Quick navigation" })).toBeVisible()
    } else {
      await expect(page.getByRole("link", { name: "Timetable" }).first()).toBeVisible()
    }

    // Now/next lesson card or the "no more lessons" line.
    if (today.now_or_next) {
      await expect(page.getByRole("region", { name: /^(Now|Next lesson)$/ })).toBeVisible()
    } else {
      await expect(page.getByText("No more lessons today.")).toBeVisible()
    }

    // Today's lessons: one entry per lesson of the day.
    if (today.lessons.length > 0) {
      const timeline = page.getByRole("region", { name: "Today's lessons" })
      await expect(timeline).toBeVisible()
      await expect(timeline.getByRole("link")).toHaveCount(today.lessons.length)
      await expect(timeline.getByText(today.lessons[0]?.subject.name ?? "").first()).toBeVisible()
    }

    // The semester card shows the GPA and absences.
    const semester = page.getByRole("region", { name: /^(This semester|Semester \d+)$/ })
    await expect(semester).toBeVisible()
    await expect(semester.getByText("Absences")).toBeVisible()

    await a11y(page, testInfo, { label: "sp today" })

    // A lesson of the timeline opens its page.
    if (today.lessons.length > 0) {
      await page.getByRole("region", { name: "Today's lessons" }).getByRole("link").first().click()
      await expect(page).toHaveURL(new RegExp(`^${URLS.sp}/lessons/view/\\?id=`))
      await expect(page.locator("main").first()).toBeVisible()
      await a11y(page, testInfo, { label: "sp lesson" })
    }
  })

  test("the pages behind the navigation load without errors", async ({ page }, testInfo) => {
    await loginAs(page, STUDENT, "sp")
    for (const [path, title] of [
      ["/timetable/", "Timetable"],
      ["/subjects/", "Subjects"],
      ["/grades/", "Grades"],
      ["/attendance/", "Attendance"],
      ["/homework/", "Homework"],
      ["/notifications/", "Notifications"],
      ["/profile/", "Profile"],
      ["/settings/", "Settings"],
    ] as const) {
      await page.goto(`${URLS.sp}${path}`)
      await expect(heading(page, title, 1)).toBeVisible()
      await a11y(page, testInfo, { label: `sp ${path}` })
    }
  })
})
