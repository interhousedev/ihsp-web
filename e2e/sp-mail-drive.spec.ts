/**
 * The Email page (compose form, sent list) and the Drive picker behind "Attach a file from My files": search, type
 * filter, upload inside the picker, select.
 */

import { STUDENT } from "./fixtures/accounts"
import { URLS } from "./fixtures/env"
import { textFile } from "./fixtures/files"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading } from "./fixtures/ui"

test("mail page: compose form and the Drive picker attach a file", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp", { path: "/mail/" })
  await expect(heading(page, "Email", 1)).toBeVisible()
  await expect(page.getByRole("heading", { name: "Sent" })).toBeVisible()
  await expect(page.getByLabel("To")).toBeVisible()
  await expect(page.getByLabel("Subject")).toBeVisible()
  await a11y(page, testInfo, { label: "sp mail page" })

  await page.getByRole("button", { name: "Attach a file from My files" }).click()
  const picker = page.getByRole("dialog", { name: "My files" })
  await expect(picker).toBeVisible()
  await expect(picker.getByLabel("Search by name")).toBeVisible()
  await expect(picker.getByLabel("File type")).toBeVisible()
  await a11y(page, testInfo, { label: "sp drive picker" })

  // Upload a small file inside the picker, find it by name and select it.
  const name = `e2e-picker-${Date.now()}.txt`
  await picker.locator('input[type="file"]').setInputFiles(textFile(name, "hello picker"))
  await picker.getByLabel("Search by name").fill(name)
  const file = picker.getByRole("list", { name: "Files" }).getByRole("button", { name })
  await expect(file).toBeVisible({ timeout: 60_000 })
  await file.click()
  await expect(picker.getByText("1 selected")).toBeVisible()
  await picker.getByRole("button", { name: "Select", exact: true }).click()
  await expect(picker).toBeHidden()
  await expect(page.getByText(name)).toBeVisible()
  await page.getByRole("button", { name: "Remove attachment" }).click()
  await expect(page.getByRole("button", { name: "Attach a file from My files" })).toBeVisible()
})
