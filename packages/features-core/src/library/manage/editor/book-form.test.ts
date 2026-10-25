import { describe, expect, it } from "bun:test"
import type { BookInput, SuggestedBook } from "@ihsp/api"
import { emptyForm, formFromInput, formFromSuggestion, inputFromForm, suggestedFromForm } from "./book-form"

describe("book form tags", () => {
  it("keeps tags when a saved book is loaded and saved again", () => {
    const input: BookInput = {
      title: "Ghazals",
      authors: ["Alisher Navoiy"],
      language: "uz_latn",
      type: "fiction",
      years_of_study: [],
      subjects: [],
      topics: [],
      visibility: "lyceum",
      download_allowed: true,
      tags: ["poetry", "classics"],
      rights: "official",
    }

    const form = formFromInput(input, null)
    expect(form.tags).toEqual(["poetry", "classics"])
    expect(inputFromForm(form).tags).toEqual(["poetry", "classics"])
  })

  it("defaults to no tags for a book saved before tags existed", () => {
    expect(formFromInput({ ...emptyInput(), tags: undefined }, null).tags).toEqual([])
  })
})

describe("suggestions", () => {
  it("sends the form as a suggested book with its cover but without rights or visibility", () => {
    const form = { ...emptyForm("Otkan kunlar"), authors: ["Abdulla Qodiriy"], tags: ["novel"], coverFileId: "c1" }
    const book = suggestedFromForm(form)

    expect(book).toMatchObject({
      title: "Otkan kunlar",
      authors: ["Abdulla Qodiriy"],
      tags: ["novel"],
      type: "textbook",
    })
    expect(book).not.toHaveProperty("visibility")
    expect(book.cover_file_id).toBe("c1")
  })

  it("starts the librarian's form from a student's suggested book", () => {
    const suggested: SuggestedBook = {
      title: "Otkan kunlar",
      authors: ["Abdulla Qodiriy"],
      translators: [],
      language: "uz_latn",
      type: "fiction",
      year_published: 1926,
      tags: ["novel"],
      years_of_study: [1],
      subjects: [{ role: "core", subject_id: "s1", year_of_study: null }],
      topics: [{ topic_id: "t1", page_from: 3, page_to: 9 }],
    }
    const form = formFromSuggestion(suggested)

    expect(form).toMatchObject({ title: "Otkan kunlar", yearPublished: "1926", tags: ["novel"], type: "fiction" })
    expect(form.topics).toEqual([{ topic_id: "t1", page_from: "3", page_to: "9" }])
    expect(form.subjects).toHaveLength(1)
  })
})

function emptyInput(): BookInput {
  return {
    title: "T",
    authors: [],
    language: "uz_latn",
    type: "fiction",
    years_of_study: [],
    subjects: [],
    topics: [],
    visibility: "lyceum",
    download_allowed: true,
    rights: "official",
  }
}
