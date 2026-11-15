import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import en from "../../../../messages/en.json"
import { type BookLine, bookLines, paginate } from "../utils/rating-book"
import { RatingBookDocument } from "./rating-book-document"

describe("rating book", () => {
  it("renders the title, fields, semester band and share/download actions", async () => {
    renderWithProviders(<RatingBookDocument />, { messages: en, route: "/grades/" })

    expect(await screen.findByText("REYTING DAFTARCHA / RATING BOOK")).toBeInTheDocument()
    expect(screen.getByText("Student:")).toBeInTheDocument()
    expect(screen.getAllByText(/Semester \d/).length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument()
  })

  it("paginates long books and keeps a band off the end of a page", () => {
    const lines: BookLine[] = bookLines({
      semesters: [1, 2].map((semester) => ({
        semester,
        gpa: null,
        subjects: Array.from({ length: 20 }, (_, i) => ({
          subject: { id: `${semester}-${i}`, name: `S${i}`, short_name: null },
          semester_mark: i === 0 ? null : 4,
          emis_rating: null,
        })),
      })),
    })
    const pages = paginate(lines)

    expect(pages.length).toBe(2)
    expect(pages.every((page) => page.at(-1)?.kind !== "band")).toBe(true)
    expect(lines.find((line) => line.kind === "row")).toMatchObject({ mark: "-" })
  })
})
