/**
 * EXAM-2, EXAM-3, UF-ADM-10: the admin exams list. Every control of every group, planned and not confirmed by default;
 * each filter reaches the API; a switch adds the control weeks that have no date for a subject yet.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, ids, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ExamsPage } from "../features/exams/components/exams-page"
import { watchExamRequests, type ExamWatcher } from "./exam-helpers"
import { configureTests, messages, pickDate, renderAdmin, setViewportWidth, waitUntil } from "./helpers"

configureTests()

let watcher: ExamWatcher
beforeEach(() => {
  watcher = watchExamRequests()
})
afterEach(() => watcher.stop())

/** The table body; the filters repeat subject names as options, so row texts are looked up here. */
function table(): HTMLElement {
  return screen.getByRole("table")
}

/** The table row that holds `text`. */
function rowOf(text: string): HTMLElement {
  const row = within(table())
    .getAllByRole("row")
    .find((candidate) => within(candidate).queryByText(text))
  if (!row) throw new Error(`no row with ${text}`)
  return row
}

async function renderList(route = "/exams/") {
  const view = renderAdmin(<ExamsPage />, { route })
  await screen.findByText("Algebra and functions")
  return view
}

describe("exams list", () => {
  test("asks for the default list: no status, no undated", async () => {
    await renderList()

    const first = watcher.requests.find((params) => !params.has("status"))
    expect(first).toBeDefined()
    expect(first?.has("undated")).toBe(false)
  })

  test("lists the planned and not confirmed controls with their status", async () => {
    await renderList()

    const rows = within(table())
    expect(rows.getByText("Algebra and functions")).toBeInTheDocument()
    expect(rows.getByText("Physics")).toBeInTheDocument()
    expect(rows.getByText("History")).toBeInTheDocument()
    expect(within(rowOf("Algebra and functions")).getByText("Planned")).toBeInTheDocument()
    expect(within(rowOf("Physics")).getByText("Not confirmed")).toBeInTheDocument()
    expect(rows.queryByText("Date not set")).not.toBeInTheDocument()
  })

  test("a row shows date, subject, group, control week, time, room, source, author and note", async () => {
    await renderList()

    const row = within(rowOf("Algebra and functions"))
    expect(row.getByText("Wed 14 Oct")).toBeInTheDocument()
    expect(row.getByText("Mathematics")).toBeInTheDocument()
    expect(row.getByText("2TN2")).toBeInTheDocument()
    expect(row.getByText("Midterm 1")).toBeInTheDocument()
    expect(row.getByText("09:00")).toBeInTheDocument()
    expect(row.getByText("204")).toBeInTheDocument()
    expect(row.getByText("Teacher")).toBeInTheDocument()
    expect(row.getByText("Rakhimov Timur")).toBeInTheDocument()
    expect(row.getByText("Chapters 1–4; bring a calculator.")).toBeInTheDocument()
  })

  test("an EMIS date outside a control week shows its kind and no author", async () => {
    await renderList()

    const row = within(rowOf("Mechanics"))
    expect(row.getByText("Midterm (PC)")).toBeInTheDocument()
    expect(row.getByText("EMIS")).toBeInTheDocument()
    // Time, room, author and note are all unknown.
    expect(row.getAllByText("—")).toHaveLength(4)
  })

  test("says so when no exam matches", async () => {
    server.use(http.get(apiUrl("/v1/admin/assessments"), () => HttpResponse.json({ items: [] })))
    renderAdmin(<ExamsPage />, { route: "/exams/" })

    expect(await screen.findByText("No exams match these filters.")).toBeInTheDocument()
  })

  test("a refusal of the list is shown with its translated message", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/assessments"), () =>
        HttpResponse.json(
          { type: "common/forbidden", title: "Forbidden", status: 403 },
          { status: 403, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmin(<ExamsPage />, { route: "/exams/" })

    expect(await screen.findByText("You do not have permission to do this.")).toBeInTheDocument()
  })
})

describe("exams to confirm", () => {
  test("counts the dates nobody confirmed", async () => {
    await renderList()

    expect(await screen.findByRole("button", { name: /To confirm: 2/ })).toBeInTheDocument()
  })

  test("pressing the chip asks for the not confirmed ones and shows only those", async () => {
    const { user } = await renderList()

    const chip = await screen.findByRole("button", { name: /To confirm: 2/ })
    expect(chip).toHaveAttribute("aria-pressed", "false")
    await user.click(chip)

    await watcher.waitFor((params) => params.get("status") === "tentative" && params.has("from") === false)
    await screen.findByRole("button", { name: /To confirm: 2/, pressed: true })
    await waitUntil(() => screen.queryByText("Algebra and functions") === null, "the planned rows stay")
    expect(screen.getByText("Mechanics")).toBeInTheDocument()
  })

  test("pressing it again goes back to the default list", async () => {
    const { user } = renderAdmin(<ExamsPage />, { route: "/exams/?status=tentative" })
    await screen.findByText("Mechanics")

    await user.click(await screen.findByRole("button", { name: /To confirm: 2/, pressed: true }))

    expect(await screen.findByText("Algebra and functions")).toBeInTheDocument()
  })

  test("with nothing to confirm the chip is a plain note", async () => {
    server.use(http.get(apiUrl("/v1/admin/assessments"), () => HttpResponse.json({ items: [] })))
    renderAdmin(<ExamsPage />, { route: "/exams/" })

    expect(await screen.findByText("No dates are waiting for confirmation.")).toBeInTheDocument()
  })
})

describe("exam filters", () => {
  test("the group is sent as group_id", async () => {
    const { user } = await renderList()

    await user.selectOptions(await screen.findByRole("combobox", { name: "Group" }), "2TN2")

    await watcher.waitFor((params) => params.get("group_id") === ids.group2TN2)
  })

  test("the subject is sent as subject_id", async () => {
    const { user } = await renderList()

    await user.selectOptions(await screen.findByRole("combobox", { name: "Subject" }), "Physics")

    await watcher.waitFor((params) => params.get("subject_id") === ids.physics)
    expect(await within(table()).findByText("Mechanics")).toBeInTheDocument()
    await waitUntil(() => within(table()).queryByText("Algebra and functions") === null, "the other subjects stay")
  })

  test("the kind is sent as kind", async () => {
    const { user } = await renderList()

    await user.selectOptions(await screen.findByRole("combobox", { name: "Kind" }), "final")

    await watcher.waitFor((params) => params.get("kind") === "final")
    expect(await within(table()).findByText("Klaster")).toBeInTheDocument()
  })

  test("the status is sent as status", async () => {
    const { user } = await renderList()

    await user.selectOptions(await screen.findByRole("combobox", { name: "Status" }), "planned")

    await watcher.waitFor((params) => params.get("status") === "planned")
  })

  test("the source is sent as source", async () => {
    const { user } = await renderList()

    await user.selectOptions(await screen.findByRole("combobox", { name: "Source" }), "head_student")

    await watcher.waitFor((params) => params.get("source") === "head_student")
    expect(await within(table()).findByText("The head student suggests this date.")).toBeInTheDocument()
  })

  test("the first and last day are sent as from and to", async () => {
    const { user } = await renderList()

    await pickDate(user, screen.getByRole("button", { name: "From date" }), "2026-10-12")
    await watcher.waitFor((params) => params.get("from") === "2026-10-12")
    await pickDate(user, screen.getByRole("button", { name: "To date" }), "2026-10-20")
    await watcher.waitFor((params) => params.get("from") === "2026-10-12" && params.get("to") === "2026-10-20")
  })

  test("a control week asks for its dates and keeps the rows of that week", async () => {
    const { user } = await renderList()

    await user.selectOptions(await screen.findByRole("combobox", { name: "Control week" }), "midterm_2")

    await watcher.waitFor((params) => params.get("from") === "2026-11-16" && params.get("to") === "2026-11-21")
    expect(await within(table()).findByText("History")).toBeInTheDocument()
    await waitUntil(() => within(table()).queryByText("Algebra and functions") === null, "the other weeks stay")
  })

  test("the control weeks offered are the ones set for the current term", async () => {
    await renderList()

    const select = await screen.findByRole("combobox", { name: "Control week" })
    const labels = within(select)
      .getAllByRole("option")
      .map((option) => option.textContent)
    expect(labels).toEqual([
      "All control weeks",
      "Midterm 1 · 12–17 Oct",
      "Midterm 2 · 16–21 Nov",
      "Final (FC) · 14–19 Dec",
    ])
  })

  test("filters in the address are applied and shown", async () => {
    renderAdmin(<ExamsPage />, {
      route: `/exams/?group_id=${ids.group2TN2}&kind=midterm&status=planned&source=teacher`,
    })

    await watcher.waitFor(
      (params) =>
        params.get("group_id") === ids.group2TN2 &&
        params.get("kind") === "midterm" &&
        params.get("status") === "planned" &&
        params.get("source") === "teacher",
    )
    expect(await screen.findByRole("combobox", { name: "Group" })).toHaveValue(ids.group2TN2)
    expect(screen.getByRole("combobox", { name: "Kind" })).toHaveValue("midterm")
  })

  test("a choice the API does not know is not sent", async () => {
    renderAdmin(<ExamsPage />, { route: "/exams/?status=archived&kind=oral&control=spring" })

    await screen.findByText("Algebra and functions")
    expect(watcher.requests.every((params) => !params.has("kind") && params.get("status") !== "archived")).toBe(true)
  })

  test("reset clears the filters", async () => {
    const { user } = await renderList(`/exams/?group_id=${ids.group2TN2}`)
    await screen.findByText("Algebra and functions")

    await user.click(screen.getByRole("button", { name: "Reset" }))

    expect(await screen.findByRole("combobox", { name: "Group" })).toHaveValue("")
  })
})

describe("control weeks without a date", () => {
  test("are left out until the switch is on", async () => {
    await renderList()

    expect(screen.getByRole("switch", { name: "Show control weeks without a date" })).not.toBeChecked()
    expect(within(table()).queryByText("English")).not.toBeInTheDocument()
  })

  test("the switch asks for undated rows and shows the week instead of a date", async () => {
    const { user } = await renderList()

    await user.click(screen.getByRole("switch", { name: "Show control weeks without a date" }))

    await watcher.waitFor((params) => params.get("undated") === "true")
    await within(table()).findByText("English")
    const row = within(rowOf("English"))
    expect(row.getByText("12–17 Oct")).toBeInTheDocument()
    expect(row.getByText("Midterm 1")).toBeInTheDocument()
    expect(row.getByText("Date not set")).toBeInTheDocument()
    expect(row.getByRole("button", { name: "Set the date of English for 2TN2" })).toBeInTheDocument()
  })

  test("a week without a date can only be given a date", async () => {
    const { user } = await renderList()
    await user.click(screen.getByRole("switch", { name: "Show control weeks without a date" }))

    await within(table()).findByText("Informatics")
    const row = within(rowOf("Informatics"))
    expect(row.queryByRole("button", { name: /^Confirm/ })).not.toBeInTheDocument()
    expect(row.queryByRole("button", { name: /^Cancel/ })).not.toBeInTheDocument()
    expect(row.getAllByRole("button")).toHaveLength(1)
  })

  test("undated=true in the address turns the switch on", async () => {
    renderAdmin(<ExamsPage />, { route: "/exams/?undated=true" })

    expect(await screen.findByRole("switch", { name: "Show control weeks without a date" })).toBeChecked()
    await watcher.waitFor((params) => params.get("undated") === "true")
  })
})

describe("exams list on other screens and in other languages", () => {
  test("on a phone every exam is a card with its actions", async () => {
    setViewportWidth(360)
    try {
      renderAdmin(<ExamsPage />, { route: "/exams/" })

      expect(await screen.findByText("Algebra and functions")).toBeInTheDocument()
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Confirm Physics on 21 Oct 2026" })).toBeInTheDocument()
    } finally {
      setViewportWidth(1280)
    }
  })

  test("the page speaks Russian", async () => {
    renderAdmin(<ExamsPage />, { route: "/exams/", locale: "ru", messages: messages.ru })

    expect(await screen.findByRole("heading", { name: "Экзамены" })).toBeInTheDocument()
    const rows = within(await screen.findByRole("table"))
    // The subject names come from the API in the language it was asked for; the fixtures are English.
    expect(await rows.findAllByText("Не подтверждён")).toHaveLength(2)
    expect(rows.getAllByText("Назначен").length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Новый экзамен" })).toBeInTheDocument()
  })

  test("the page speaks Uzbek", async () => {
    renderAdmin(<ExamsPage />, { route: "/exams/", locale: "uz", messages: messages.uz })

    expect(await screen.findByRole("heading", { name: "Imtihonlar" })).toBeInTheDocument()
    const rows = within(await screen.findByRole("table"))
    expect(await rows.findAllByText("Tasdiqlanmagan")).toHaveLength(2)
    expect(screen.getByRole("button", { name: "Yangi imtihon" })).toBeInTheDocument()
  })
})
