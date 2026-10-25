/**
 * The Today dashboard of the student portal: Edit mode, add a widget from the catalogue, resize it, Done saves the
 * layout (it survives a reload). The spec removes the widget again so that it can run repeatedly.
 */

import { STUDENT } from "./fixtures/accounts"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"

test("Today dashboard: add a widget, resize it, save, remove it", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp", { path: "/" })
  const dashboard = page.getByRole("region", { name: "My widgets" })
  await expect(dashboard).toBeVisible()
  const tile = page.getByRole("button", { name: "Select Flash cards" })
  const had = await tile.count()

  async function save() {
    await dashboard.getByRole("button", { name: "Done" }).click()
    await expect(dashboard.getByRole("button", { name: "Edit" })).toBeVisible()
  }

  // Add "Flash cards" from the catalogue.
  await dashboard.getByRole("button", { name: "Edit" }).click()
  await dashboard.getByRole("button", { name: "Add widget" }).click()
  const catalogue = page.getByRole("list", { name: "Widget catalogue" })
  await expect(catalogue).toBeVisible()
  await a11y(page, testInfo, { label: "sp dashboard catalogue" })
  await catalogue.getByRole("button", { name: "Flash cards" }).click()
  await expect(tile).toHaveCount(had + 1)

  // Select the new tile and resize it.
  await tile.last().click()
  const editor = page.getByRole("region", { name: "Widget settings" })
  await expect(editor).toBeVisible()
  const sizes = editor.getByRole("group", { name: "Size" })
  await sizes.getByRole("button", { name: "2x1", exact: true }).click()
  await expect(sizes.getByRole("button", { name: "2x1", exact: true })).toHaveAttribute("aria-pressed", "true")
  await save()

  // The layout is stored: it is still there after a reload.
  await page.reload()
  await expect(page.getByRole("button", { name: "Edit" }).first()).toBeVisible()
  await page.getByRole("button", { name: "Edit" }).first().click()
  await expect(tile).toHaveCount(had + 1)

  // Clean up: remove the widget again.
  await tile.last().click()
  await page.getByRole("region", { name: "Widget settings" }).getByRole("button", { name: "Remove" }).click()
  await expect(tile).toHaveCount(had)
  await page.getByRole("button", { name: "Done" }).click()
  await expect(page.getByRole("button", { name: "Edit" }).first()).toBeVisible()
})
