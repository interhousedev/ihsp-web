import { describe, expect, it } from "bun:test"
import { isUntitledChat } from "./untitled-chat"

describe("isUntitledChat", () => {
  it("recognises the placeholder title in every language", () => {
    for (const title of ["Новый чат", "New chat", "Yangi chat", " new chat "]) expect(isUntitledChat(title)).toBe(true)
  })

  it("keeps chats that got a title from their first message", () => {
    expect(isUntitledChat("Что такое интеграл?")).toBe(false)
    expect(isUntitledChat("")).toBe(false)
  })
})
