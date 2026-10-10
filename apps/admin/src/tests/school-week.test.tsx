/** The lyceum does not study on Saturdays: timetable, entry editor and bell rows offer Monday to Friday only. */
import { describe, expect, test } from "bun:test"
import type { Bell } from "@ihsp/api"
import { currentTerm } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { TermCard } from "../features/terms/components/term-card"
import { TermsPage } from "../features/terms/components/terms-page"
import { EntryEditorDialog } from "../features/timetable/components/entry-editor-dialog"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { configureTests, renderAdmin, setViewportWidth } from "./helpers"

configureTests()

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const SCHOOL_DAYS = ALL_DAYS.slice(0, 5)

describe("the school week in the timetable", () => {
  test("the desktop grid has the five weekday columns, Monday to Friday, and no Saturday", async () => {
    renderAdmin(<TimetablePage />, { route: "/timetable/" })
    await screen.findByRole("columnheader", { name: "Monday" })

    const days = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent ?? "")
      .filter((name) => ALL_DAYS.includes(name))
    expect(days).toEqual(SCHOOL_DAYS)
    expect(screen.queryByRole("columnheader", { name: "Saturday" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Saturday/ })).not.toBeInTheDocument()
  })

  test("the phone list has five day cards, Monday to Friday", async () => {
    setViewportWidth(360)
    try {
      renderAdmin(<TimetablePage />, { route: "/timetable/" })
      await screen.findByRole("region", { name: "Monday" })

      const days = screen
        .getAllByRole("region")
        .map((region) => region.getAttribute("aria-label") ?? "")
        .filter((name) => ALL_DAYS.includes(name))
      expect(days).toEqual(SCHOOL_DAYS)
      expect(screen.queryByRole("region", { name: "Saturday" })).not.toBeInTheDocument()
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
    } finally {
      setViewportWidth(1280)
    }
  })

  test("the weekday select of the entry editor lists the five school days only", () => {
    renderAdmin(
      <EntryEditorDialog
        term={currentTerm}
        entry={null}
        defaults={{ weekday: 5, period: 1 }}
        open
        onClose={() => undefined}
      />,
      { route: "/timetable/" },
    )

    const select = screen.getByLabelText(/^Weekday/)
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(SCHOOL_DAYS)
    expect(select).toHaveValue("5")
  })
})

describe("the school week in the terms editor", () => {
  test("every bell row has five weekday chips, Monday to Friday", async () => {
    const { user } = renderAdmin(<TermsPage />, { route: "/terms/" })
    await screen.findByText("2026-2027, half 1")

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0] as HTMLElement)
    const dialog = await screen.findByRole("dialog")

    const rows = within(dialog).getAllByRole("group", { name: /^Weekdays of period/ })
    expect(rows).toHaveLength(currentTerm.bells.length)
    for (const row of rows) {
      expect(
        within(row)
          .getAllByRole("button")
          .map((chip) => chip.textContent),
      ).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"])
    }
  })

  test("the term card names the weekdays of a bell only when it does not run on all school days", () => {
    const bells: Bell[] = [
      { period: 1, start: "08:30", end: "09:15", weekdays: [1, 2, 3, 4, 5], source: "manual" },
      { period: 2, start: "09:25", end: "10:10", weekdays: [1, 2, 3], source: "manual" },
    ]
    renderAdmin(<TermCard term={{ ...currentTerm, bells }} onEdit={() => undefined} />)

    expect(screen.getByText("1. 08:30–09:15")).toBeInTheDocument()
    expect(screen.getByText("2. 09:25–10:10 · Mon, Tue, Wed")).toBeInTheDocument()
  })
})
