import { describe, expect, it } from "bun:test"
import { splitDropped } from "./composer-drop"

const ACCEPT = ".pdf,.docx,.png,.jpg"

describe("splitDropped", () => {
  it("keeps the files the upload accepts, matching the extension in any case", () => {
    const pdf = new File(["x"], "Notes.PDF")
    const png = new File(["x"], "photo.png")
    const { accepted, rejected } = splitDropped([pdf, png], ACCEPT)
    expect(accepted.map((file) => file.name)).toEqual(["Notes.PDF", "photo.png"])
    expect(rejected).toEqual([])
  })

  it("rejects a file of a type the upload does not take, and names it", () => {
    const exe = new File(["x"], "setup.exe")
    const { accepted, rejected } = splitDropped([exe, new File(["x"], "a.docx")], ACCEPT)
    expect(accepted.map((file) => file.name)).toEqual(["a.docx"])
    expect(rejected.map((file) => file.name)).toEqual(["setup.exe"])
  })

  it("rejects a file without an extension", () => {
    expect(splitDropped([new File(["x"], "README")], ACCEPT).rejected).toHaveLength(1)
  })
})
