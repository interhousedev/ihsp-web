/**
 * UF-WEB-20: the assistant (fake LLM) wants to create a flash card set, which is a write action: it waits for the
 * student's approval. Approve creates the set; Reject with a reason stops it. The fake LLM asks for the tool when the
 * message contains "flash".
 */

import type { ChatItem, FlashcardSetItem, Page as ApiPage } from "@ihsp/api"
import { STUDENT } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading } from "./fixtures/ui"

test("UF-WEB-20 approve and reject an assistant action", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/assistant/`)
  await expect(heading(page, "Assistant", 1)).toBeVisible()
  await a11y(page, testInfo, { label: "sp assistant" })

  const topic = `derivatives ${Date.now()}`

  // The first message is written on the home screen: it creates the chat and opens it.
  const message = page.getByRole("textbox", { name: "Message" })
  await message.fill(`Make flash cards about ${topic}`)
  await page.getByRole("button", { name: "Send" }).click()
  await expect(page).toHaveURL(new RegExp(`${URLS.sp}/assistant/chat/\\?id=`))
  const chatId = new URL(page.url()).searchParams.get("id") ?? ""

  try {
    // 1. The assistant proposes a set; the card waits for approval.
    await expect(page.getByText(`Make flash cards about ${topic}`)).toBeVisible()
    const approve = page.getByRole("button", { name: "Approve" })
    await expect(approve).toBeVisible({ timeout: 45_000 })
    await expect(page.getByText(/Waiting for you until/)).toBeVisible()
    await a11y(page, testInfo, { label: "sp assistant approval" })

    // 2. Approve: the action runs and the assistant answers with the result.
    await approve.click()
    await expect(page.getByText("Done", { exact: true }).first()).toBeVisible({ timeout: 45_000 })
    await expect(page.getByText(/\(fake\) Tool result/)).toBeVisible({ timeout: 45_000 })
    const sets = await api<FlashcardSetItem[]>(page, "GET", "/v1/me/flashcard-sets")
    const created = sets.find((set) => set.title.includes(topic.slice(0, 20)))
    expect(created, "the approved action created a flash card set").toBeTruthy()
    expect(created?.source).toBe("ai")

    // 3. A second proposal is rejected with a reason.
    await message.fill(`Another flash set about ${topic}`)
    await page.getByRole("button", { name: "Send" }).click()
    await expect(page.getByRole("button", { name: "Reject" })).toBeVisible({ timeout: 45_000 })
    await page.getByRole("button", { name: "Reject" }).click()
    await page.getByLabel("Reason (optional)").fill("Make the cards shorter")
    await page.getByRole("button", { name: "Send rejection" }).click()
    await expect(page.getByText("Rejected", { exact: true })).toBeVisible({ timeout: 45_000 })
    await expect(page.getByText("Reason: Make the cards shorter")).toBeVisible()

    // 4. The set made by the first approval is in Flash cards, marked as made by the assistant.
    await page.goto(`${URLS.sp}/flashcards/`)
    await expect(page.getByText(created?.title ?? "")).toBeVisible()
    await expect(page.getByText("Assistant", { exact: true }).first()).toBeVisible()
    if (created) await api(page, "DELETE", `/v1/me/flashcard-sets/${created.id}`).catch(() => undefined)
  } finally {
    await api(page, "DELETE", `/v1/ai/chats/${chatId}`).catch(() => undefined)
  }
})

test("UF-WEB-20 sidebar: the new chat is listed under Recent and has a menu", async ({ page }) => {
  await loginAs(page, STUDENT, "sp")
  const created = await api<ChatItem>(page, "POST", "/v1/ai/chats", { assistant: "student" })
  try {
    await page.goto(`${URLS.sp}/assistant/`)
    const chats = await api<ApiPage<ChatItem>>(page, "GET", "/v1/ai/chats?assistant=student")
    expect(chats.items.some((chat) => chat.id === created.id)).toBe(true)
    // The sidebar lists the chats under "Recent"; its menu offers Delete.
    await expect(page.getByText("Recent", { exact: true })).toBeVisible()
    await page
      .getByRole("button", { name: /^Options for / })
      .first()
      .click()
    await expect(page.getByRole("menuitem", { name: "Delete" })).toBeVisible()
  } finally {
    await api(page, "DELETE", `/v1/ai/chats/${created.id}`).catch(() => undefined)
  }
})
