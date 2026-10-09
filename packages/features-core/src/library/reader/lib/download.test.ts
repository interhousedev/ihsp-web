import { afterEach, describe, expect, it, spyOn } from "bun:test"
import { downloadText, fileNameFor } from "./download"

describe("fileNameFor", () => {
  it("keeps letters and digits of any script and joins the rest with hyphens", () => {
    expect(fileNameFor("Fizika 10: Mexanika (2024)", "md")).toBe("Fizika-10-Mexanika-2024.md")
    expect(fileNameFor("Отабек: «Ўткан кунлар»", "md")).toBe("Отабек-Ўткан-кунлар.md")
  })

  it("falls back for a title with nothing usable and cuts a long one", () => {
    expect(fileNameFor("???", "md")).toBe("library-notes.md")
    expect(fileNameFor("a".repeat(200), "md")).toHaveLength(63)
  })
})

describe("downloadText", () => {
  const created: string[] = []
  afterEach(() => {
    created.length = 0
  })

  it("clicks a hidden link with the file name and removes it again", async () => {
    const create = spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      created.push(String((blob as Blob).size))
      return "blob:test"
    })
    spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)
    const clicked: { download: string; href: string }[] = []
    const click = spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ download: this.download, href: this.href })
    })

    downloadText("notes.md", "# Notes")

    expect(create).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(clicked).toEqual([{ download: "notes.md", href: "blob:test" }])
    expect(document.querySelector("a[download]")).toBeNull()
    expect(created).toEqual(["7"])
  })
})
