/**
 * UF-ADM-08: Administration writes a broadcast, picks the audience (the recipient count follows the filters), sends it
 * and the message reaches the fake Telegram outbox (Redis list `fake-telegram:outbox`). A student of 2TN2 has a linked
 * fake Telegram account; the worker (`scripts/dev.sh worker`) delivers the message.
 */

import { ADMIN, STUDENT } from "./fixtures/accounts"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { TELEGRAM_USERS, lastTelegramMessageId, linkTelegram, waitForTelegram } from "./fixtures/telegram-fake"
import { a11y, expect, test } from "./fixtures/test"
import { heading, toast } from "./fixtures/ui"

test("UF-ADM-08 a broadcast reaches the Telegram outbox of the audience", async ({ page }, testInfo) => {
  test.slow()
  await linkTelegram(TELEGRAM_USERS.student, STUDENT.login, STUDENT.password)
  const before = await lastTelegramMessageId()

  await loginAs(page, ADMIN, "admin", { path: "/broadcasts/" })
  await expect(heading(page, "Broadcasts", 1)).toBeVisible()
  await a11y(page, testInfo, { label: "admin broadcasts" })
  await page
    .getByRole("link", { name: "New broadcast" })
    .or(page.getByRole("button", { name: "New broadcast" }))
    .first()
    .click()
  await expect(heading(page, "New broadcast", 1)).toBeVisible()

  const title = `E2E broadcast ${Date.now()}`
  const text = `Hello 2TN2, this is an e2e test ${Date.now()}`
  await page.getByRole("textbox", { name: "Title", exact: true }).fill(title)
  await page.getByRole("textbox", { name: "Text", exact: true }).fill(text)

  // The audience builder counts recipients while the filters change.
  const count = page.getByTestId("audience-count")
  await page.getByRole("checkbox", { name: "2TN2" }).check()
  await expect(count).toContainText(/Recipients: [1-9]\d*/)
  const recipients = Number(/Recipients: (\d+)/.exec((await count.textContent()) ?? "")?.[1] ?? 0)
  await a11y(page, testInfo, { label: "admin broadcast editor" })

  // Save the draft, then send it.
  await page.getByRole("button", { name: "Save draft" }).click()
  await expect(toast(page, "Draft saved")).toBeVisible()
  await page.getByRole("button", { name: "Send now" }).click()
  const confirm = page.getByRole("alertdialog", { name: "Send this broadcast now?" })
  await expect(confirm).toContainText(`${recipients} recipients`)
  await confirm.getByRole("button", { name: "Send now" }).click()
  await expect(toast(page, "Broadcast is being sent")).toBeVisible()

  // The message arrives in the fake outbox for the linked Telegram account.
  const message = await waitForTelegram({ afterMessageId: before, chatId: TELEGRAM_USERS.student.id, contains: text })
  expect(message.kind).toBe("message")

  // The list shows the broadcast as sent (or sending) with the delivery line.
  await expect(page).toHaveURL(new RegExp(`${URLS.admin}/broadcasts/`))
  await expect(page.getByText(title).first()).toBeVisible()
})
