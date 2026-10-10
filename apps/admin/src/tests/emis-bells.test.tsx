/** ACA-4, ADM-18, UF-ADM-05: EMIS class hours are the default bells; Administration can override time and weekdays. */
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
  test("an EMIS bell has the badge and every field except the period number can be changed", () => {
    renderEditor(mixed)

    expect(screen.getAllByText("EMIS")).toHaveLength(1)
    const [emisRow, manualRow] = screen.getAllByRole("listitem") as [HTMLElement, HTMLElement]
    expect(within(emisRow).getByLabelText("Period")).toBeDisabled()
    expect(within(manualRow).getByLabelText("Period")).toBeEnabled()
    for (const label of ["Start", "End"]) expect(within(emisRow).getByLabelText(label)).toBeEnabled()
    const days = within(emisRow).getByRole("group", { name: "Weekdays of period 1" })
    for (const day of within(days).getAllByRole("button")) expect(day).toBeEnabled()
  })

  test("there are no explanatory paragraphs above the rows", () => {
    renderEditor(mixed)

    expect(screen.queryByText(/cannot be changed here/)).not.toBeInTheDocument()
    expect(screen.queryByText(/second row/)).not.toBeInTheDocument()
  })

  test("changing the time of an EMIS bell makes it an override and remembers the EMIS time", () => {
    const { onChange } = renderEditor(mixed)
    const emisRow = screen.getAllByRole("listitem")[0] as HTMLElement

    setValue(within(emisRow).getByLabelText("End"), "09:00")

    expect(onChange).toHaveBeenLastCalledWith([
      { ...mixed[0], end: "09:00", source: "override", emis_start: "08:30", emis_end: "09:15" },
      mixed[1],
    ])
  })

  test("Saturday can be deselected on an EMIS bell", () => {
    const { onChange } = renderEditor(mixed)
    const emisRow = screen.getAllByRole("listitem")[0] as HTMLElement
    const saturday = within(within(emisRow).getByRole("group", { name: "Weekdays of period 1" })).getAllByRole(
      "button",
    )[5] as HTMLElement
    expect(saturday).toHaveAttribute("aria-pressed", "true")

    fireEvent.click(saturday)

    expect(onChange).toHaveBeenLastCalledWith([
      { ...mixed[0], weekdays: [1, 2, 3, 4, 5], source: "override", emis_start: "08:30", emis_end: "09:15" },
      mixed[1],
    ])
  })

  test("Reset to EMIS in the row menu restores the EMIS time and all weekdays", async () => {
    const overridden: Bell = {
      period: 1,
      start: "08:30",
      end: "09:00",
      weekdays: [1, 2, 3],
      source: "override",
      emis_start: "08:30",
      emis_end: "09:15",
    }
    const onChange = mock((_bells: Bell[]) => undefined)
    const { user } = renderAdmin(<BellsEditor bells={[overridden]} onChange={onChange} />)
    expect(screen.getByText("Edited")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Actions for period 1" }))
    await user.click(await screen.findByRole("menuitem", { name: "Reset to EMIS" }))

    expect(onChange).toHaveBeenLastCalledWith([
      {
        period: 1,
        start: "08:30",
        end: "09:15",
        weekdays: [1, 2, 3, 4, 5, 6],
        source: "emis",
        emis_start: null,
        emis_end: null,
      },
    ])
  })

  test("a bell set by hand stays editable: times, weekdays and removing from the menu", async () => {
    const onChange = mock((_bells: Bell[]) => undefined)
    const { user } = renderAdmin(<BellsEditor bells={mixed} onChange={onChange} />)
    const manualRow = screen.getAllByRole("listitem")[1] as HTMLElement

    setValue(within(manualRow).getByLabelText("Start"), "14:20")
    expect(onChange).toHaveBeenLastCalledWith([mixed[0], { ...mixed[1], start: "14:20" }])

    const saturday = within(within(manualRow).getByRole("group", { name: "Weekdays of period 7" })).getAllByRole(
      "button",
    )[5] as HTMLElement
    fireEvent.click(saturday)
    expect(onChange).toHaveBeenLastCalledWith([mixed[0], { ...mixed[1], weekdays: [1, 2, 3, 4, 5, 6] }])

    await user.click(within(manualRow).getByRole("button", { name: "Actions for period 7" }))
    await user.click(await screen.findByRole("menuitem", { name: "Remove period 7" }))
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

  test("without EMIS bells there is no badge and every row can be edited", () => {
    renderEditor(bells)

    expect(screen.queryByText("EMIS")).not.toBeInTheDocument()
    expect(screen.getAllByLabelText("Start").every((field) => !(field as HTMLInputElement).disabled)).toBe(true)
    expect(screen.getAllByRole("button", { name: /^Actions for period/ })).toHaveLength(bells.length)
  })
})

describe("term editor", () => {
  test("editing a term with EMIS bells keeps them unchanged with their source when nothing is touched", async () => {
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
    expect(
      within(dialog)
        .getAllByLabelText("Start")
        .every((field) => !(field as HTMLInputElement).disabled),
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
