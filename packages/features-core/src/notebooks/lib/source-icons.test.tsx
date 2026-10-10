import { describe, expect, test } from "bun:test"
import type { SourceKind } from "@ihsp/api"
import { sourceIcon } from "./source-icons"

describe("sourceIcon", () => {
  test("every kind, library books and notes included, has an icon", () => {
    const kinds: SourceKind[] = [
      "file",
      "chat",
      "lesson_resource",
      "flashcard_set",
      "lms_step",
      "text",
      "note",
      "url",
      "web_result",
      "library_item",
      "library_notes",
    ]
    for (const kind of kinds) expect(sourceIcon({ kind }).Icon).toBeDefined()
  })

  test("a kind the build does not know falls back to a plain file icon", () => {
    expect(sourceIcon({ kind: "something_new" as SourceKind }).Icon).toBeDefined()
  })
})
