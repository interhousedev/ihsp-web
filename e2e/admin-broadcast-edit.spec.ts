/**
 * Administration edits a broadcast that is still a draft: it is opened from the list, the title and the text change,
 * "Save draft" stores it, and the saved version is there after a reload. Nothing is sent.
 */

import { ADMIN } from "./fixtures/accounts"
import { unique } from "./fixtures/data"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading, toast } from "./fixtures/ui"

test("broadcast edit: a draft is changed from the list and saved again", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, ADMIN, "admin", { path: "/broadcasts/" })
  await expect(heading(page, "Broadcasts", 1)).toBeVisible()
  await page.getByRole("link", { name: "New broadcast", exact: true }).first().click()
  await expect(heading(page, "New broadcast", 1)).toBeVisible()

  const first = unique("E2E draft")
  await page.getByRole("textbox", { name: "Title", exact: true }).fill(first)
  await page.getByRole("textbox", { name: "Text", exact: true }).fill(`Draft text for the edit test ${first}`)
  await page.getByRole("button", { name: "Save draft" }).click()
  await expect(toast(page, "Draft saved")).toBeVisible()

  // Back to the list: the draft is a row; its link opens the editor of this broadcast.
  await page.goto(`${URLS.admin}/broadcasts/`)
  await page.getByRole("link", { name: first }).first().click()
  await expect(page).toHaveURL(new RegExp(`${URLS.admin}/broadcasts/edit/\\?id=`))
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveValue(first)

  const edited = `${first} (edited)`
  await page.getByRole("textbox", { name: "Title", exact: true }).fill(edited)
  await page.getByRole("button", { name: "Save draft" }).click()
  await expect(toast(page, "Draft saved")).toBeVisible()
  await a11y(page, testInfo, { label: "admin broadcast draft edited" })

  await page.reload()
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveValue(edited)
})
