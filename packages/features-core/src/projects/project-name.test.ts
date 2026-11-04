import { describe, expect, it } from "bun:test"
import { MAX_PROJECT_NAME_LENGTH, normalizeProjectName, projectChatHref, projectHref } from "./project-name"

describe("normalizeProjectName", () => {
  it("trims the name and keeps its inner spaces", () => {
    expect(normalizeProjectName("  Physics   lab  ")).toBe("Physics   lab")
  })

  it("refuses a blank name", () => {
    expect(normalizeProjectName("   ")).toBeNull()
    expect(normalizeProjectName("")).toBeNull()
  })

  it("cuts a name longer than the server limit", () => {
    const long = "а".repeat(MAX_PROJECT_NAME_LENGTH + 10)
    expect(normalizeProjectName(long)).toHaveLength(MAX_PROJECT_NAME_LENGTH)
  })
})

describe("project links", () => {
  it("opens a project with the id in the query string, not in a dynamic segment", () => {
    expect(projectHref("/assistant", "p-1")).toBe("/assistant/project/?id=p-1")
  })

  it("opens a chat of a project in the normal chat page", () => {
    expect(projectChatHref("/assistant", "c-9")).toBe("/assistant/chat/?id=c-9")
  })

  it("encodes ids in the query string", () => {
    expect(projectHref("/assistant", "a b&c")).toBe("/assistant/project/?id=a%20b%26c")
  })
})
