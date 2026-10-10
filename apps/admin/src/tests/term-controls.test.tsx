/**
 * EXAM-1, ADM-18, UF-ADM-05: Administration sets the weeks of the two midterm controls and the final control per term.
 * The term form maps them to `control_periods` and mirrors the backend rule (inside the term, start <= end, each after
 * the previous one); the term card lists them.
 */
import { describe, expect, test } from "bun:test"
import type { ControlPeriods } from "@ihsp/api"
import { apiUrl, controlPeriods, currentTerm, previousTerm, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { TermCard } from "../features/terms/components/term-card"
import { TermsPage } from "../features/terms/components/terms-page"
import {
  controlIssues,
  emptyTermForm,
  termInput,
  termToForm,
  validateTerm,
  type TermForm,
} from "../features/terms/utils/term-form"
import { configureTests, pickDate, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

function withWeeks(weeks: ControlPeriods): TermForm {
  return termToForm({ ...currentTerm, control_periods: weeks })
}

describe("term form: control weeks", () => {
  test("a term loaded from the API shows its weeks and leaves the missing ones empty", () => {
    const form = termToForm({ ...currentTerm, control_periods: { midterm_1: controlPeriods.midterm_1 } })

    expect(form.control_periods.midterm_1).toEqual({ start: "2026-10-12", end: "2026-10-17" })
    expect(form.control_periods.midterm_2).toEqual({ start: null, end: null })
    expect(form.control_periods.final).toEqual({ start: null, end: null })
  })

  test("a new term has no control weeks, even when the template has some", () => {
    const form = emptyTermForm(currentTerm)

    expect(Object.values(form.control_periods)).toEqual([
      { start: null, end: null },
      { start: null, end: null },
      { start: null, end: null },
    ])
  })

  test("weeks inside the term, in order, are valid; so are no weeks at all", () => {
    expect(validateTerm(withWeeks(controlPeriods))).toEqual([])
    expect(validateTerm(withWeeks({}))).toEqual([])
  })

  test("a week with only one date is incomplete", () => {
    const form = withWeeks({ midterm_1: { start: "2026-10-12", end: "2026-10-17" } })
    form.control_periods.midterm_2 = { start: "2026-11-16", end: null }

    expect(validateTerm(form)).toEqual(["controlIncomplete"])
    expect(controlIssues(form)).toEqual({ midterm_2: "controlIncomplete" })
  })

  test("a week that ends before it starts is reversed", () => {
    const form = withWeeks({ midterm_1: { start: "2026-10-17", end: "2026-10-12" } })

    expect(validateTerm(form)).toEqual(["controlOrder"])
    expect(controlIssues(form)).toEqual({ midterm_1: "controlOrder" })
  })

  test("a week outside the term is rejected, on either side; the term's first and last day are fine", () => {
    const before = withWeeks({ midterm_1: { start: "2026-09-01", end: "2026-09-05" } })
    const after = withWeeks({ final: { start: "2026-12-28", end: "2027-01-02" } })
    const edges = withWeeks({
      midterm_1: { start: "2026-09-02", end: "2026-09-05" },
      final: { start: "2026-12-28", end: "2026-12-30" },
    })

    expect(controlIssues(before)).toEqual({ midterm_1: "controlOutside" })
    expect(controlIssues(after)).toEqual({ final: "controlOutside" })
    expect(validateTerm(edges)).toEqual([])
  })

  test("a term with wrong dates gets only that message, not one more for every week", () => {
    const reversed = withWeeks(controlPeriods)
    reversed.ends_on = "2026-09-01"

    expect(validateTerm(reversed)).toEqual(["order"])
    expect(controlIssues(reversed)).toEqual({})
  })

  test("a week must start after the previous one ends; a day apart is enough", () => {
    const overlapping = withWeeks({
      midterm_1: { start: "2026-10-12", end: "2026-10-17" },
      midterm_2: { start: "2026-10-17", end: "2026-10-20" },
    })
    const adjacent = withWeeks({
      midterm_1: { start: "2026-10-12", end: "2026-10-17" },
      midterm_2: { start: "2026-10-18", end: "2026-10-20" },
    })

    expect(validateTerm(overlapping)).toEqual(["controlSequence"])
    expect(controlIssues(overlapping)).toEqual({ midterm_2: "controlSequence" })
    expect(validateTerm(adjacent)).toEqual([])
  })

  test("the previous week is the previous one that is set, so the final cannot precede midterm 1", () => {
    const form = withWeeks({
      midterm_1: { start: "2026-11-02", end: "2026-11-07" },
      final: { start: "2026-10-12", end: "2026-10-17" },
    })

    expect(controlIssues(form)).toEqual({ final: "controlSequence" })
  })

  test("every problem is listed once", () => {
    const form = withWeeks({
      midterm_1: { start: "2026-10-17", end: "2026-10-12" },
      midterm_2: { start: "2026-08-01", end: "2026-08-05" },
    })
    form.control_periods.final = { start: "2026-12-14", end: null }

    expect(validateTerm(form)).toEqual(["controlOrder", "controlOutside", "controlIncomplete"])
  })

  test("a new term sends its weeks; a week not set is left out", () => {
    const form = withWeeks({ midterm_1: controlPeriods.midterm_1, final: controlPeriods.final })

    expect(termInput(form).control_periods).toEqual({
      midterm_1: controlPeriods.midterm_1,
      final: controlPeriods.final,
    })
    expect(termInput(emptyTermForm()).control_periods).toEqual({})
  })

  test("an edited term sends the weeks only when they changed", () => {
    const unchanged = termToForm(currentTerm)
    expect(termInput(unchanged, currentTerm)).not.toHaveProperty("control_periods")

    const changed = termToForm(currentTerm)
    changed.control_periods.final = { start: "2026-12-15", end: "2026-12-19" }
    expect(termInput(changed, currentTerm).control_periods).toEqual({
      ...controlPeriods,
      final: { start: "2026-12-15", end: "2026-12-19" },
    })
  })

  test("clearing the last week sends an empty object, which replaces the stored weeks", () => {
    const form = termToForm(currentTerm)
    form.control_periods = {
      midterm_1: { start: null, end: null },
      midterm_2: { start: null, end: null },
      final: { start: null, end: null },
    }

    expect(termInput(form, currentTerm).control_periods).toEqual({})
  })
})

describe("term card: control weeks", () => {
  test("lists each week as a chip with its dates", () => {
    renderAdmin(<TermCard term={currentTerm} onEdit={() => undefined} />)

    expect(screen.getByText("Midterm 1: 12–17 Oct")).toBeInTheDocument()
    expect(screen.getByText("Midterm 2: 16–21 Nov")).toBeInTheDocument()
    expect(screen.getByText("Final (FC): 14–19 Dec")).toBeInTheDocument()
  })

  test("says 'not set' for a week Administration has not set", () => {
    renderAdmin(
      <TermCard
        term={{ ...currentTerm, control_periods: { midterm_1: controlPeriods.midterm_1 } }}
        onEdit={() => undefined}
      />,
    )

    expect(screen.getByText("Midterm 1: 12–17 Oct")).toBeInTheDocument()
    expect(screen.getByText("Midterm 2: not set")).toBeInTheDocument()
    expect(screen.getByText("Final (FC): not set")).toBeInTheDocument()
  })

  test("a week that crosses a month shows both months", () => {
    renderAdmin(
      <TermCard
        term={{ ...currentTerm, control_periods: { midterm_1: { start: "2026-10-28", end: "2026-11-02" } } }}
        onEdit={() => undefined}
      />,
    )

    expect(screen.getByText("Midterm 1: 28 Oct – 2 Nov")).toBeInTheDocument()
  })

  test("a term from before control weeks existed shows all three as not set", () => {
    renderAdmin(<TermCard term={previousTerm} onEdit={() => undefined} />)

    expect(screen.getAllByText(/: not set$/)).toHaveLength(3)
  })
})

async function openEditor() {
  const view = renderAdmin(<TermsPage />, { route: "/terms/" })
  await screen.findByText("2026-2027, half 1")
  await view.user.click(screen.getAllByRole("button", { name: "Edit" })[0] as HTMLElement)
  const dialog = await screen.findByRole("dialog")
  return { ...view, dialog }
}

describe("term editor: control weeks", () => {
  test("shows the saved weeks in the dialog", async () => {
    const { dialog } = await openEditor()

    expect(within(dialog).getByRole("heading", { name: "Control weeks" })).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Midterm 1: first day" })).toHaveTextContent("12 Oct 2026")
    expect(within(dialog).getByRole("button", { name: "Midterm 1: last day" })).toHaveTextContent("17 Oct 2026")
    expect(within(dialog).getByRole("button", { name: "Final (FC): first day" })).toHaveTextContent("14 Dec 2026")
  })

  test("saving without touching the weeks does not send them", async () => {
    let body: Record<string, unknown> | undefined
    server.use(
      http.patch(apiUrl("/v1/admin/terms/:id"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(currentTerm)
      }),
    )
    const { user, dialog } = await openEditor()

    await user.click(within(dialog).getByRole("button", { name: "Save term" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).not.toHaveProperty("control_periods")
  })

  test("changing the final week sends all three weeks", async () => {
    let body: Record<string, unknown> | undefined
    server.use(
      http.patch(apiUrl("/v1/admin/terms/:id"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(currentTerm)
      }),
    )
    const { user, dialog } = await openEditor()

    await pickDate(user, within(dialog).getByRole("button", { name: "Final (FC): last day" }), "2026-12-20")
    await user.click(within(dialog).getByRole("button", { name: "Save term" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body?.control_periods).toEqual({ ...controlPeriods, final: { start: "2026-12-14", end: "2026-12-20" } })
  })

  test("clearing a week leaves it out of the request", async () => {
    let body: Record<string, unknown> | undefined
    server.use(
      http.patch(apiUrl("/v1/admin/terms/:id"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(currentTerm)
      }),
    )
    const { user, dialog } = await openEditor()

    await user.click(within(dialog).getByRole("button", { name: "Clear Midterm 2" }))
    expect(within(dialog).getByRole("button", { name: "Midterm 2: first day" })).toHaveTextContent("Pick a date")
    await user.click(within(dialog).getByRole("button", { name: "Save term" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body?.control_periods).toEqual({ midterm_1: controlPeriods.midterm_1, final: controlPeriods.final })
  })

  test("a reversed week is not saved and the row says why", async () => {
    let sent = false
    server.use(
      http.patch(apiUrl("/v1/admin/terms/:id"), () => {
        sent = true
        return HttpResponse.json(currentTerm)
      }),
    )
    const { user, dialog } = await openEditor()

    await pickDate(user, within(dialog).getByRole("button", { name: "Midterm 1: first day" }), "2026-10-19")
    await user.click(within(dialog).getByRole("button", { name: "Save term" }))

    // Once in the list of problems and once under the week.
    expect(await within(dialog).findAllByText("A control week must end on or after the day it starts.")).toHaveLength(2)
    expect(sent).toBe(false)
  })

  test("a week that starts before the previous one ends is not saved", async () => {
    const { user, dialog } = await openEditor()

    await pickDate(user, within(dialog).getByRole("button", { name: "Midterm 2: first day" }), "2026-10-16")
    await user.click(within(dialog).getByRole("button", { name: "Save term" }))

    expect(
      await within(dialog).findAllByText("Each control week must start after the previous one ends."),
    ).toHaveLength(2)
  })

  test("moving the end of the term before a week puts that week outside the term", async () => {
    const { user, dialog } = await openEditor()

    await pickDate(user, dialog.querySelector("#term-ends") as HTMLElement, "2026-12-10")
    await user.click(within(dialog).getByRole("button", { name: "Save term" }))

    expect(await within(dialog).findAllByText("A control week must lie inside the term.")).toHaveLength(2)
  })

  test("the server's rejection of the weeks is shown with its translated title", async () => {
    server.use(
      http.patch(apiUrl("/v1/admin/terms/:id"), () =>
        HttpResponse.json(
          {
            type: "academic/term-control-periods-invalid",
            title: "Invalid control periods",
            status: 422,
            message_key: "academic-term-control-periods-invalid",
            params: { control: "midterm_2" },
          },
          { status: 422, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user, dialog } = await openEditor()

    await user.click(within(dialog).getByRole("button", { name: "Clear Final (FC)" }))
    await user.click(within(dialog).getByRole("button", { name: "Save term" }))

    expect(
      await within(dialog).findByText(/^A control week is invalid: it must start on or before its end/),
    ).toBeInTheDocument()
  })

  test("a new term is created with the weeks that were set", async () => {
    let body: Record<string, unknown> | undefined
    server.use(
      http.post(apiUrl("/v1/admin/terms"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(currentTerm)
      }),
    )
    const { user } = renderAdmin(<TermsPage />, { route: "/terms/" })
    await screen.findByText("2026-2027, half 1")
    await user.click(screen.getByRole("button", { name: "New term" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("button", { name: "Midterm 1: first day" })).toHaveTextContent("Pick a date")

    // A term inside one month keeps the calendars on the month they open on (paging them is slow in happy-dom).
    setValue(within(dialog).getByLabelText(/^Academic year/), "2027-2028")
    await pickDate(user, dialog.querySelector("#term-starts") as HTMLElement, "2026-10-01")
    await pickDate(user, dialog.querySelector("#term-ends") as HTMLElement, "2026-10-31")
    await pickDate(user, within(dialog).getByRole("button", { name: "Midterm 1: first day" }), "2026-10-12")
    await pickDate(user, within(dialog).getByRole("button", { name: "Midterm 1: last day" }), "2026-10-17")
    await user.click(within(dialog).getByRole("button", { name: "Save term" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body?.academic_year).toBe("2027-2028")
    expect(body?.control_periods).toEqual({ midterm_1: { start: "2026-10-12", end: "2026-10-17" } })
  })
})
