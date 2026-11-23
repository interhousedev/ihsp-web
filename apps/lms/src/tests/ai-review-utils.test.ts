import { describe, expect, test } from "bun:test"
import type { AiReviewMessage } from "@ihsp/api"
import {
  acceptAttribute,
  fileKind,
  isAccepted,
  latestReview,
  messageSource,
  uploadContentType,
} from "../features/player/utils/ai-review"

function message(partial: Partial<AiReviewMessage>): AiReviewMessage {
  return {
    id: "m",
    role: "assistant",
    text: null,
    openui: null,
    attachments: [],
    kind: "chat",
    created_at: "2026-11-23T10:00:00Z",
    ...partial,
  }
}

describe("ai review file kinds", () => {
  test("detects by content type, then by extension", () => {
    expect(fileKind({ name: "a.bin", type: "application/pdf" })).toBe("pdf")
    expect(fileKind({ name: "Report.DOCX", type: "" })).toBe("docx")
    expect(fileKind({ name: "photo.jpeg", type: "" })).toBe("image")
    expect(fileKind({ name: "run.exe", type: "application/x-msdownload" })).toBeNull()
  })

  test("accepts only the block's kinds", () => {
    expect(isAccepted({ name: "a.pdf", type: "application/pdf" }, ["pdf"])).toBe(true)
    expect(isAccepted({ name: "a.png", type: "image/png" }, ["pdf", "text"])).toBe(false)
  })

  test("builds the accept attribute", () => {
    expect(acceptAttribute(["pdf", "text"])).toBe(
      "application/pdf,.pdf,text/plain,text/markdown,text/csv,.txt,.md,.csv",
    )
  })

  test("fills in a missing content type", () => {
    expect(uploadContentType({ name: "notes.md", type: "" })).toBe("text/markdown")
    expect(uploadContentType({ name: "a.webp", type: "" })).toBe("image/webp")
    expect(uploadContentType({ name: "a.png", type: "image/png" })).toBe("image/png")
    expect(uploadContentType({ name: "a.zip", type: "application/zip" })).toBeNull()
  })
})

describe("ai review messages", () => {
  test("finds the newest review", () => {
    const first = message({ id: "1", kind: "review" })
    const second = message({ id: "2", kind: "review" })
    expect(latestReview([first, message({ kind: "question" }), second])?.id).toBe("2")
    expect(latestReview([message({ kind: "chat" })])).toBeNull()
  })

  test("joins text and the OpenUI block", () => {
    expect(messageSource({ text: "Hi", openui: "```openui\nx\n```" })).toBe("Hi\n\n```openui\nx\n```")
    expect(messageSource({ text: null, openui: null })).toBe("")
  })
})
