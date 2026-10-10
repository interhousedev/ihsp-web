/**
 * Administration: the school settings are saved and read back; a user's name is edited; a password is set by hand for
 * an account without a mailbox (the new password is handed over in person, the user changes it at the next login).
 * Every change is put back afterwards, so the demo accounts keep working.
 */

import { ADMIN, STUDENT_FIRST_YEAR } from "./fixtures/accounts"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading, toast } from "./fixtures/ui"

test("settings: the support contact is saved and read back", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, ADMIN, "admin", { path: "/settings/" })
  await expect(heading(page, "Settings", 1)).toBeVisible()
  await expect(page.getByText("Server features")).toBeVisible()
  await a11y(page, testInfo, { label: "admin settings" })

  const support = page.getByLabel(/^Support contact/)
  const original = await support.inputValue()
  const marker = `e2e ${Date.now() % 100_000}`
  try {
    await support.fill(marker)
    await page.getByRole("button", { name: "Save", exact: true }).click()
    await expect(toast(page, "Settings saved")).toBeVisible()
    await page.reload()
    await expect(page.getByLabel(/^Support contact/)).toHaveValue(marker)
  } finally {
    await page.getByLabel(/^Support contact/).fill(original)
    await page.getByRole("button", { name: "Save", exact: true }).click()
  }
})

test("users: edit the name of a user, then set a password by hand", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, ADMIN, "admin", { path: "/users/" })
  await expect(heading(page, "Users & roles", 1)).toBeVisible()
  await page.getByPlaceholder("Name or login").fill(STUDENT_FIRST_YEAR.login)
  await page.getByRole("link", { name: /Ergashev/ }).first().click()
  await expect(page).toHaveURL(new RegExp(`${URLS.admin}/users/view/\\?id=`))
  await a11y(page, testInfo, { label: "admin user detail" })

  // Edit: the dialog is filled from the user; the middle name is changed and then put back.
  await page.getByRole("button", { name: "Edit", exact: true }).click()
  const edit = page.getByRole("dialog", { name: "Edit user" })
  await expect(edit).toBeVisible()
  await expect(edit.getByLabel(/^First name/)).not.toHaveValue("")
  const middle = edit.getByLabel(/^Middle name/)
  const originalMiddle = await middle.inputValue()
  try {
    await middle.fill("E2E")
    await edit.getByRole("button", { name: "Save", exact: true }).click()
    await expect(toast(page, "User saved")).toBeVisible()
    await page.getByRole("button", { name: "Edit", exact: true }).click()
    await expect(page.getByRole("dialog", { name: "Edit user" }).getByLabel(/^Middle name/)).toHaveValue("E2E")
    await page.getByRole("dialog", { name: "Edit user" }).getByRole("button", { name: "Cancel", exact: true }).click()
  } finally {
    await page.getByRole("button", { name: "Edit", exact: true }).click()
    await page
      .getByRole("dialog", { name: "Edit user" })
      .getByLabel(/^Middle name/)
      .fill(originalMiddle)
    await page.getByRole("dialog", { name: "Edit user" }).getByRole("button", { name: "Save", exact: true }).click()
    await expect(toast(page, "User saved")).toBeVisible()
  }

  // Set password: a weak one is refused; a strong one is set and the change at the first login stays on by default.
  await page.getByRole("button", { name: "Set password", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: /^Set password:/ })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("checkbox", { name: /Change at first login/ })).toBeChecked()
  await dialog.getByLabel(/^New password/).fill("weak")
  await expect(dialog.getByRole("button", { name: "Set password", exact: true })).toBeDisabled()
  await dialog.getByLabel(/^New password/).fill("E2eReset1")
  await dialog.getByRole("button", { name: "Set password", exact: true }).click()
  await expect(toast(page, /^Password of .* set$/)).toBeVisible()

  // Put the demo password back, without the change at the first login, so the demo student can sign in again.
  await page.getByRole("button", { name: "Set password", exact: true }).click()
  const restore = page.getByRole("dialog", { name: /^Set password:/ })
  await restore.getByLabel(/^New password/).fill("StudentDemo1")
  await restore.getByRole("checkbox", { name: /Change at first login/ }).click()
  await restore.getByRole("button", { name: "Set password", exact: true }).click()
  await expect(toast(page, /^Password of .* set$/)).toBeVisible()
})
