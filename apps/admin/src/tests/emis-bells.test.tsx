/** ACA-4, ADM-18, UF-ADM-05: bells synced from EMIS class hours carry an EMIS badge and are read-only. */
import { describe, expect, mock, test } from "bun:test"
import type { Bell } from "@ihsp/api"
import { apiUrl, bells, currentTerm, emisBells, previousTerm, server } from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { BellsEditor } from "../features/terms/components/bells-editor"
import { TermCard } from "../features/terms/components/term-card"
import { TermsPage } from "../features/terms/components/terms-page"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

const HINT = "Synced from EMIS class hours"
const NOTE =
  "Periods marked EMIS are synced from EMIS class hours, so they cannot be changed here. Periods without the mark can be edited."

/** Period 1 from EMIS, period 7 set by hand: the usual mix after a sync. */
const mixed: Bell[] = [
  { period: 1, start: "08:30", end: "09:15", weekdays: [1, 2, 3, 4, 5, 6], source: "emis" },
  { period: 7, start: "14:10", end: "14:55", weekdays: [1, 2, 3, 4, 5], source: "manual" },
]

function renderEditor(value: Bell[]) {
  const onChange = mock((_bells: Bell[]) => undefined)
  const view = renderAdmin(<BellsEditor bells={value} onChange={onChange} />)
  return { ...view, onChange }
}

describe("term card", () => {
  test("marks the bells synced from EMIS with a badge and says where they come from", () => {
    renderAdmin(<TermCard term={previousTerm} onEdit={() => undefined} />)

    expect(screen.getAllByText("EMIS")).toHaveLength(emisBells.length)
    expect(screen.getAllByTitle(HINT)).toHaveLength(emisBells.length)
    expect(screen.getByText(HINT)).toBeInTheDocument()
  })

  test("shows no badge and no hint for bells set by hand", () => {
    renderAdmin(<TermCard term={currentTerm} onEdit={() => undefined} />)

    expect(screen.queryByText("EMIS")).not.toBeInTheDocument()
    expect(screen.queryByText(HINT)).not.toBeInTheDocument()
  })

  test("in a mixed term only the EMIS periods get the badge", () => {
    renderAdmin(<TermCard term={{ ...currentTerm, bells: mixed }} onEdit={() => undefined} />)

    const emisLine = screen.getByText(/^1\. 08:30–09:15/).closest("li")
    const manualLine = screen.getByText(/^7\. 14:10–14:55/).closest("li")
    expect(within(emisLine as HTMLElement).getByText("EMIS")).toBeInTheDocument()
    expect(within(manualLine as HTMLElement).queryByText("EMIS")).not.toBeInTheDocument()
  })

  test("the terms page shows the badges of the EMIS term only", async () => {
    renderAdmin(<TermsPage />, { route: "/terms/" })

    await screen.findByText("2025-2026, half 2")
    expect(screen.getAllByText("EMIS")).toHaveLength(emisBells.length)
  })
})

describe("bells editor", () => {
  test("an EMIS bell has the badge, a note and fields that cannot be changed", () => {
    renderEditor(mixed)

    expect(screen.getByText(NOTE)).toBeInTheDocument()
    expect(screen.getAllByText("EMIS")).toHaveLength(1)
    const [emisRow, manualRow] = screen.getAllByRole("listitem") as [HTMLElement, HTMLElement]
    for (const label of ["Period", "Start", "End"]) {
      expect(within(emisRow).getByLabelText(label)).toBeDisabled()
      expect(within(manualRow).getByLabelText(label)).toBeEnabled()
    }
    const days = within(emisRow).getByRole("group", { name: "Weekdays of period 1" })
    for (const day of within(days).getAllByRole("button")) expect(day).toBeDisabled()
    expect(within(emisRow).queryByRole("button", { name: "Remove period 1" })).not.toBeInTheDocument()
  })

  test("a bell set by hand stays editable: times, weekdays and removing", () => {
    const { onChange } = renderEditor(mixed)
    const manualRow = screen.getAllByRole("listitem")[1] as HTMLElement

    setValue(within(manualRow).getByLabelText("Start"), "14:20")
    expect(onChange).toHaveBeenLastCalledWith([mixed[0], { ...mixed[1], start: "14:20" }])

    const saturday = within(within(manualRow).getByRole("group", { name: "Weekdays of period 7" })).getAllByRole(
      "button",
    )[5] as HTMLElement
    fireEvent.click(saturday)
    expect(onChange).toHaveBeenLastCalledWith([mixed[0], { ...mixed[1], weekdays: [1, 2, 3, 4, 5, 6] }])

    fireEvent.click(within(manualRow).getByRole("button", { name: "Remove period 7" }))
    expect(onChange).toHaveBeenLastCalledWith([mixed[0]])
  })

  test("a new period is set by hand", () => {
    const { onChange } = renderEditor(mixed)

    fireEvent.click(screen.getByRole("button", { name: "Add period" }))

    expect(onChange).toHaveBeenLastCalledWith([
      ...mixed,
      { period: 8, start: "", end: "", weekdays: [1, 2, 3, 4, 5, 6], source: "manual" },
    ])
  })

  test("without EMIS bells there is no badge or note and every row can be edited", () => {
    renderEditor(bells)

    expect(screen.queryByText("EMIS")).not.toBeInTheDocument()
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument()
    expect(screen.getAllByLabelText("Start").every((field) => !(field as HTMLInputElement).disabled)).toBe(true)
    expect(screen.getAllByRole("button", { name: /^Remove period/ })).toHaveLength(bells.length)
  })
})

describe("term editor", () => {
  test("editing a term with EMIS bells locks them and saves them unchanged with their source", async () => {
    let body: { bells: Bell[]; academic_year: string } | undefined
    server.use(
      http.patch(apiUrl("/v1/admin/terms/:id"), async ({ request }) => {
        body = (await request.json()) as typeof body
        return HttpResponse.json(previousTerm)
      }),
    )
    const { user } = renderAdmin(<TermsPage />, { route: "/terms/" })
    await screen.findByText("2025-2026, half 2")

    await user.click(screen.getAllByRole("button", { name: "Edit" })[1] as HTMLElement)
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(NOTE)).toBeInTheDocument()
    expect(
      within(dialog)
        .getAllByLabelText("Start")
        .every((field) => (field as HTMLInputElement).disabled),
    ).toBe(true)
    setValue(within(dialog).getByLabelText(/^Academic year/), "2025-2026 (revised)")
    await user.click(within(dialog).getByRole("button", { name: "Save term" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body?.academic_year).toBe("2025-2026 (revised)")
    expect(body?.bells).toEqual(emisBells)
  })

  test("a term set by hand opens with every bell editable", async () => {
    const { user } = renderAdmin(<TermsPage />, { route: "/terms/" })
    await screen.findByText("2026-2027, half 1")

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0] as HTMLElement)
    const dialog = await screen.findByRole("dialog")

    expect(within(dialog).queryByText("EMIS")).not.toBeInTheDocument()
    expect(
      within(dialog)
        .getAllByLabelText("Start")
        .every((field) => !(field as HTMLInputElement).disabled),
    ).toBe(true)
  })
})
