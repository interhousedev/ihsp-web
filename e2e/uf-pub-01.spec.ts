/**
 * UF-PUB-01: a student shares an assistant chat. The link opens the public viewer without login: it shows the
 * conversation and a "shared publicly" note. A revoked link says it was removed, an unknown one that it is not found.
 */

import type { ChatItem, LinkItem } from "@ihsp/api"
import { STUDENT } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { shareSlug } from "./fixtures/share"
import { a11y, expect, test } from "./fixtures/test"
import { toast } from "./fixtures/ui"

test("UF-PUB-01 share a chat as a snapshot and open it without login", async ({
  page,
  newGuardedContext,
  allowConsoleError,
}, testInfo) => {
  test.slow()
  allowConsoleError(/status of (404|410)/)
  await loginAs(page, STUDENT, "sp")
  const text = `hello shared world ${Date.now()}`
  const chat = await api<ChatItem>(page, "POST", "/v1/ai/chats", { assistant: "student" })

  try {
    await api(page, "POST", `/v1/ai/chats/${chat.id}/messages`, { text, file_ids: [] })

    // Share it from the chat page: the default is a snapshot.
    await page.goto(`${URLS.sp}/assistant/chat/?id=${chat.id}`)
    await expect(page.getByRole("article").filter({ hasText: text }).first()).toBeVisible()
    await page.getByRole("button", { name: "Share", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "Share this chat" })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText("Snapshot: messages up to now.")).toBeVisible()
    await a11y(page, testInfo, { label: "sp share dialog" })
    const created = page.waitForResponse(
      (response) => response.url() === `${URLS.api}/v1/shares` && response.request().method() === "POST",
    )
    await dialog.getByRole("button", { name: "Create link" }).click()
    const link = (await (await created).json()) as LinkItem
    expect(link.kind).toBe("chat")
    expect(link.share_mode).toBe("snapshot")
    await expect(toast(page, /Link created/)).toBeVisible()

    // An anonymous visitor opens the link.
    const visitorContext = await newGuardedContext()
    const visitor = await visitorContext.newPage()
    await visitor.goto(link.url)
    await expect(visitor.getByText(text).first()).toBeVisible({ timeout: 30_000 })
    await expect(visitor.getByText("(fake)").first()).toBeVisible()
    await expect(visitor.getByText("Shared publicly")).toBeVisible()
    await expect(visitor.getByText(/^Shared by /)).toBeVisible()
    await a11y(visitor, testInfo, { label: "share viewer" })

    // A message written after the snapshot is not in the shared chat.
    await api(page, "POST", `/v1/ai/chats/${chat.id}/messages`, { text: "after the snapshot", file_ids: [] })
    await visitor.reload()
    await expect(visitor.getByText(text).first()).toBeVisible()
    await expect(visitor.getByText("after the snapshot")).toHaveCount(0)

    // Revoked: "This link was removed".
    await api(page, "POST", `/v1/links/${link.id}/revoke`)
    await visitor.reload()
    await expect(visitor.getByText("This link was removed")).toBeVisible()

    // Unknown slug.
    await visitor.goto(`${URLS.share}/${shareSlug(link.url)}-does-not-exist`)
    await expect(visitor.getByText("Link not found")).toBeVisible()
    await a11y(visitor, testInfo, { label: "share not found" })
  } finally {
    await api(page, "DELETE", `/v1/ai/chats/${chat.id}`).catch(() => undefined)
  }
})
