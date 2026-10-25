/**
 * Assistant `/` commands: typing `/` at the start of an empty message opens the command menu, which narrows while you
 * type; Enter or a click turns the pick into a chip, Backspace in the empty field (or the chip's x) removes it, and a
 * typed `/cards ` becomes the chip as well. Nothing is sent, so no chat is created.
 */

import { STUDENT } from "./fixtures/accounts"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"

test("assistant slash commands: menu, narrowing, chip, removal", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/assistant/`)
  const field = page.getByRole("textbox", { name: "Message" })
  await expect(field).toBeVisible()

  // "/" opens the list of commands.
  await field.fill("/")
  const menu = page.getByRole("listbox", { name: "Commands" })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole("option")).not.toHaveCount(0)
  await expect(menu.locator('[data-slash-option="quiz"]')).toBeVisible()
  await a11y(page, testInfo, { label: "sp assistant slash menu" })

  // Typing narrows the list; an unknown name says so.
  await field.fill("/qui")
  await expect(menu.getByRole("option")).toHaveCount(1)
  await field.fill("/zzzz")
  await expect(page.getByText("No such command")).toBeVisible()

  // Enter picks the highlighted command: a chip and an empty field for the arguments.
  await field.fill("/qui")
  await field.press("Enter")
  const chip = page.locator('[data-slash-chip="quiz"]')
  await expect(chip).toBeVisible()
  await expect(menu).toBeHidden()
  await expect(field).toHaveValue("")

  // Backspace in the empty field removes the chip.
  await field.press("Backspace")
  await expect(chip).toHaveCount(0)

  // A click on an option picks it; the chip's x removes it.
  await field.fill("/")
  await menu.locator('[data-slash-option="mindmap"]').click()
  await expect(page.locator('[data-slash-chip="mindmap"]')).toBeVisible()
  await page.getByRole("button", { name: "Remove command /mindmap" }).click()
  await expect(page.locator('[data-slash-chip="mindmap"]')).toHaveCount(0)

  // A whole typed "/cards " becomes the chip and keeps the rest as the arguments.
  await field.fill("/cards photosynthesis")
  await expect(page.locator('[data-slash-chip="cards"]')).toBeVisible()
  await expect(field).toHaveValue("photosynthesis")
})
