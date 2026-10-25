/**
 * Student portal: the subject page opens on Overview with the mark planner and the subject notebook; "My teachers" lists
 * the teachers with status lines and contacts, and a teacher edits the contacts the student sees.
 */

import { STUDENT, TEACHER } from "./fixtures/accounts"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading, toast } from "./fixtures/ui"

test("subject Overview opens the planner and the subject notebook", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp", { path: "/subjects/" })
  await expect(heading(page, "Subjects", 1)).toBeVisible()
  await page.locator('a[href^="/subjects/view/"]').first().click()
  await expect(page).toHaveURL(/\/subjects\/view\/\?id=/)
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true")
  await a11y(page, testInfo, { label: "sp subject overview" })
  const subjectUrl = page.url()

  await page.getByRole("link", { name: "Mark planner" }).click()
  await expect(page).toHaveURL(/\/grades\/plan\/\?subject=/)
  await page.goto(subjectUrl)

  await page.getByRole("button", { name: "Open notebook" }).click()
  await expect(page).toHaveURL(/\/notebooks\/view\/\?id=/, { timeout: 60_000 })
  await expect(page.getByRole("region", { name: "Sources" })).toBeVisible()
})

test("My teachers lists teachers with status and contacts", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp", { path: "/teachers/" })
  await expect(heading(page, "My teachers", 1)).toBeVisible()
  const first = page.locator('a[href^="/teachers/view/"]').first()
  await expect(first).toBeVisible()
  await a11y(page, testInfo, { label: "sp my teachers" })
  await expect(page.getByText(/^(Now|Next):|^No lessons today/).first()).toBeVisible()
  await first.click()
  await expect(page).toHaveURL(/\/teachers\/view\/\?id=[^&#]+$/)
  await expect(page.getByText("This week")).toBeVisible()
  await expect(page.getByText("Contacts").first()).toBeVisible()
})

test("a teacher edits own contacts in Settings", async ({ page }) => {
  test.slow()
  await loginAs(page, TEACHER, "staff", { path: "/settings/" })
  const office = page.getByLabel("Office / room")
  await expect(office).toBeVisible()
  const original = await office.inputValue()
  try {
    await office.fill("E2E-101")
    await page.getByRole("button", { name: "Save", exact: true }).click()
    await expect(toast(page, "Contacts saved")).toBeVisible()
    await page.reload()
    await expect(page.getByLabel("Office / room")).toHaveValue("E2E-101")
  } finally {
    await page.getByLabel("Office / room").fill(original)
    await page.getByRole("button", { name: "Save", exact: true }).click()
  }
})
