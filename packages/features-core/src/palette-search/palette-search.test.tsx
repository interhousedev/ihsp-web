import { describe, expect, it } from "bun:test"
import { emptySearchResults, searchResults } from "@ihsp/test-utils"
import { staffRoutes, studentRoutes, toPaletteResults, type PaletteLabels } from "./palette-results"

const LABELS: PaletteLabels = {
  subjects: "Subjects",
  lessons: "Lessons",
  homework: "Homework",
  files: "Files",
  flashcardSets: "Flash card sets",
  notebooks: "Notebooks",
  marks: "Marks",
  libraryItems: "Library",
}
const FORMAT = { date: (value: string) => value }

describe("toPaletteResults", () => {
  it("gives a student every group with its icon and a deep link", () => {
    const rows = toPaletteResults(searchResults, LABELS, FORMAT, studentRoutes("https://library.test/"))
    const by = (section: string) => rows.find((row) => row.section === section)

    expect(by("Notebooks")).toMatchObject({ icon: "notebooks", subtitle: "Optics.pdf" })
    expect(by("Notebooks")?.url).toMatch(/^\/notebooks\/view\/\?id=/)
    expect(by("Marks")).toMatchObject({ icon: "grades", title: "Physics: 5" })
    expect(by("Marks")?.url).toMatch(/^\/subjects\/view\/\?id=/)
    expect(by("Library")).toMatchObject({ icon: "library" })
    expect(by("Library")?.url).toBe(`https://library.test/item/?id=${searchResults.library_items[0]?.id}`)
    expect(by("Files")?.url).toBe("/files/")
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length)
  })

  it("leaves out the groups a staff user does not have", () => {
    const rows = toPaletteResults(searchResults, LABELS, FORMAT, staffRoutes())
    const sections = new Set(rows.map((row) => row.section))

    expect(sections.has("Lessons")).toBe(true)
    expect(sections.has("Notebooks")).toBe(true)
    for (const hidden of ["Subjects", "Marks", "Flash card sets", "Files", "Library"]) {
      expect(sections.has(hidden)).toBe(false)
    }
    expect(rows.find((row) => row.section === "Lessons")?.url).toMatch(/^\/lessons\/view\/\?id=/)
  })

  it("drops the library group while the library host is not configured", () => {
    const rows = toPaletteResults(searchResults, LABELS, FORMAT, studentRoutes(""))

    expect(rows.some((row) => row.section === "Library")).toBe(false)
  })

  it("does not repeat the subject when a lesson has no topic", () => {
    const lesson = searchResults.lessons[0]!
    const rows = toPaletteResults(
      { ...emptySearchResults, lessons: [{ ...lesson, topic: null }] },
      LABELS,
      FORMAT,
      studentRoutes(""),
    )

    expect(rows[0]?.title).toBe(lesson.subject.name)
    expect(rows[0]?.subtitle).toBe(lesson.date)
  })

  it("returns nothing for empty results", () => {
    expect(toPaletteResults(emptySearchResults, LABELS, FORMAT, studentRoutes("https://library.test"))).toEqual([])
  })
})
