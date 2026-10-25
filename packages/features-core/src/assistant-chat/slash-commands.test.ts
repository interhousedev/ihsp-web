import { describe, expect, it } from "bun:test"
import { SLASH_NAMES, filterSlash, parseSlashText, slashQuery, slashText } from "./slash-commands"

const labels = (name: string) => ({ title: "x", hint: name === "summary" ? "structured notes" : "hint" })

describe("slash commands", () => {
  it("offers the eleven documented commands", () => {
    expect([...SLASH_NAMES]).toEqual([
      "goal",
      "cards",
      "quiz",
      "summary",
      "mindmap",
      "slides",
      "report",
      "table",
      "explain",
      "translate",
      "help",
    ])
  })

  it("parses and writes the short form", () => {
    expect(parseSlashText("/Cards  photosynthesis ")).toEqual({ name: "cards", args: "photosynthesis" })
    expect(parseSlashText("/help")).toEqual({ name: "help", args: "" })
    expect(slashText({ name: "quiz", args: "optics" })).toBe("/quiz optics")
    expect(slashText({ name: "help", args: "" })).toBe("/help")
  })

  it("leaves ordinary text and unknown names alone", () => {
    for (const text of ["hello /cards", "/usr/bin", "/flarp now", "", "2/3"]) expect(parseSlashText(text)).toBeNull()
  })

  it("reads the filter only while the name is being typed", () => {
    expect(slashQuery("/")).toBe("")
    expect(slashQuery("/Ca")).toBe("ca")
    expect(slashQuery("/cards x")).toBeNull()
    expect(slashQuery("cards")).toBeNull()
  })

  it("filters by name prefix first, then by title or hint", () => {
    expect(filterSlash("", labels)).toHaveLength(11)
    expect(filterSlash("s", labels).map((item) => item.name)).toEqual(["summary", "slides", "cards", "translate"])
    expect(filterSlash("structured", labels).map((item) => item.name)).toEqual(["summary"])
    expect(filterSlash("zzz", labels)).toEqual([])
  })
})
