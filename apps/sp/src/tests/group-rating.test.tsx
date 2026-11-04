/** Group rating (head student only): the table, the cards below 768 px, the 403 fallback and the empty state. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, groupRatingRows, semesterGrades, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { GroupRatingSection } from "../features/grades/components/group-rating-section"
import { configureTests, freezeTime, renderSp, setViewportWidth, unfreezeTime } from "./helpers"

configureTests()

beforeEach(() => {
  freezeTime()
  setViewportWidth(1280)
})
afterEach(() => {
  unfreezeTime()
  setViewportWidth(1280)
})

describe("group rating", () => {
  test("the table lists every student by rank with GPA and EMIS rating, and marks the student", async () => {
    renderSp(<GroupRatingSection semester={4} />)

    const table = await screen.findByRole("table")
    const rows = within(table).getAllByRole("row")
    expect(rows).toHaveLength(groupRatingRows.length + 1)
    const me = within(table).getByText("Demo Student").closest("tr") as HTMLElement
    expect(within(me).getByText("4.10")).toBeInTheDocument()
    expect(within(me).getByText("88")).toBeInTheDocument()
    expect(me).toHaveAttribute("aria-current", "true")
    const unrated = within(table).getByText("Dilnoza Rahimova").closest("tr") as HTMLElement
    expect(within(unrated).getAllByText("—").length).toBeGreaterThan(0)
  })

  test("the table sits in a named, keyboard focusable scroll region", async () => {
    renderSp(<GroupRatingSection semester={4} />)

    expect(await screen.findByRole("region", { name: "Students of the group by GPA" })).toBeInTheDocument()
  })

  test("below 768 px every student is a card instead of a table row", async () => {
    setViewportWidth(360)
    renderSp(<GroupRatingSection semester={4} />)

    expect(await screen.findByText("Aziza Karimova")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  test("a student who is not the head gets no table, only their own GPA", async () => {
    server.use(
      http.get(apiUrl("/v1/me/group/rating"), () =>
        HttpResponse.json({ type: "common/forbidden", title: "Forbidden", status: 403 }, { status: 403 }),
      ),
    )
    renderSp(<GroupRatingSection semester={4} />)

    expect(await screen.findByText(`${semesterGrades.gpa?.toFixed(2)}`)).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.queryByText("Aziza Karimova")).not.toBeInTheDocument()
  })

  test("an empty group shows the empty state, not an invented ranking", async () => {
    server.use(http.get(apiUrl("/v1/me/group/rating"), () => HttpResponse.json([])))
    renderSp(<GroupRatingSection semester={4} />)

    expect(await screen.findByText("No ratings for this semester yet.")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})
