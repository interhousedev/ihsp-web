import { describe, expect, it } from "bun:test"
import type { ItemFile } from "@ihsp/api"
import { pickFile } from "./pick-file"

const file = (id: string, overrides: Partial<ItemFile> = {}): ItemFile => ({
  id,
  format: "pdf",
  is_primary: false,
  pages: 10,
  byte_size: 1000,
  readable: true,
  text_status: "ready",
  toc: [],
  ...overrides,
})

describe("pickFile", () => {
  const files = [
    file("a"),
    file("b", { is_primary: true, format: "epub" }),
    file("c", { format: "pptx", readable: false }),
  ]

  it("opens the file named in the address when it can be drawn", () => {
    expect(pickFile({ files }, "a")?.id).toBe("a")
  })

  it("falls back to the primary readable file", () => {
    expect(pickFile({ files }, null)?.id).toBe("b")
    expect(pickFile({ files }, "unknown")?.id).toBe("b")
  })

  it("never opens a file the browser cannot draw", () => {
    expect(pickFile({ files }, "c")?.id).toBe("b")
    expect(pickFile({ files: [file("c", { format: "pptx", readable: false })] }, "c")).toBeUndefined()
    expect(pickFile({ files: [file("d", { format: "docx" })] }, null)).toBeUndefined()
  })

  it("takes any readable file when none is primary", () => {
    expect(pickFile({ files: [file("x", { format: "md" })] }, null)?.id).toBe("x")
  })
})
