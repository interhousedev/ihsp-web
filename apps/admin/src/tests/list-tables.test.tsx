/** The admin list tables: client-side sorting of the loaded rows, honest paging, row selection and the bulk actions. */
import { describe, expect, test } from "bun:test"
import { apiUrl, ids, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ExamsPage } from "../features/exams/components/exams-page"
import { col } from "../features/shared/utils/columns"
import { sortRows } from "../features/shared/utils/sort-rows"
import { StudentsPage } from "../features/students/components/students-page"
import { UsersPage } from "../features/users/components/users-page"
import { watchExamRequests } from "./exam-helpers"
import { configureTests, renderAdmin, setValue, waitUntil } from "./helpers"

configureTests()

type Row = { name: string; age: number | null; active: boolean }

const columns = [
  col<Row>("name", "Name", (row) => row.name, { sort: (row) => row.name }),
  col<Row>("age", "Age", (row) => row.age, { sort: (row) => row.age }),
  col<Row>("active", "Active", (row) => String(row.active), { sort: (row) => row.active }),
  col<Row>("plain", "Plain", (row) => row.name),
]
const rows: Row[] = [
  { name: "Ёлкин", age: 30, active: false },
  { name: "Aliyev", age: null, active: true },
  { name: "Brastilov", age: 20, active: true },
  { name: "aziz", age: 25, active: false },
]

describe("sortRows", () => {
  test("orders text by the locale, numbers by value, and keeps empty values last in both directions", () => {
    const byName = sortRows(rows, [{ id: "name", desc: false }], columns, "ru").map((row) => row.name)
    const collated = rows
      .map((row) => row.name)
      .toSorted((a, b) => a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" }))
    expect(byName).toEqual(collated)
    expect(byName.indexOf("aziz")).toBe(byName.indexOf("Aliyev") + 1)
    const byAge = sortRows(rows, [{ id: "age", desc: false }], columns).map((row) => row.age)
    expect(byAge).toEqual([20, 25, 30, null])
    const byAgeDesc = sortRows(rows, [{ id: "age", desc: true }], columns).map((row) => row.age)
    expect(byAgeDesc).toEqual([30, 25, 20, null])
  })

  test("a column without a sort accessor and an empty sorting state keep the server order", () => {
    expect(sortRows(rows, [], columns)).toEqual(rows)
    expect(sortRows(rows, [{ id: "plain", desc: true }], columns)).toEqual(rows)
    expect(columns[3]?.enableSorting).toBe(false)
    expect(columns[0]?.enableSorting).toBe(true)
  })

  test("booleans sort false before true and the sort is stable", () => {
    const names = sortRows(rows, [{ id: "active", desc: false }], columns).map((row) => row.name)
    expect(names).toEqual(["Ёлкин", "aziz", "Aliyev", "Brastilov"])
  })
})

describe("students list sorting and paging", () => {
  test("?sort= in the address orders the loaded rows and the header shows the direction", async () => {
    const sort = encodeURIComponent(JSON.stringify([{ id: "name", desc: true }]))
    renderAdmin(<StudentsPage />, { route: `/students/?sort=${sort}` })

    await screen.findByRole("link", { name: "Brastilov Aleksey" })
    const names = screen.getAllByRole("link", { name: /^[A-Z][a-z]+ [A-Z][a-z]+$/ }).map((link) => link.textContent)
    expect(names).toEqual([...names].toSorted((a, b) => (b ?? "").localeCompare(a ?? "", "en")))
    expect(screen.getByRole("button", { name: /^Name/ })).toBeInTheDocument()
  })

  test("the page count is honest: without more rows on the server it is the loaded pages", async () => {
    renderAdmin(<StudentsPage />, { route: "/students/" })

    await screen.findByRole("link", { name: "Brastilov Aleksey" })
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument()
  })

  test("a ?page= past the loaded rows comes back to the last page", async () => {
    renderAdmin(<StudentsPage />, { route: "/students/?page=7" })

    await screen.findByRole("link", { name: "Brastilov Aleksey" })
    await waitUntil(() => screen.queryByText("Page 1 of 1") !== null, "page not clamped")
  })

  test("selecting rows shows the bar with the count and Export selected", async () => {
    const { user } = renderAdmin(<StudentsPage />, { route: "/students/" })

    await screen.findByRole("link", { name: "Brastilov Aleksey" })
    expect(screen.queryByRole("region", { name: "Selected rows" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("checkbox", { name: "Select Brastilov Aleksey" }))

    const bar = await screen.findByRole("region", { name: "Selected rows" })
    expect(within(bar).getByText("1 selected")).toBeInTheDocument()
    expect(within(bar).getByRole("button", { name: "Export selected" })).toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }))
    expect(within(bar).getByText(/^\d+ selected$/).textContent).not.toBe("1 selected")

    await user.click(within(bar).getByRole("button", { name: "Clear selection" }))
    expect(screen.queryByRole("region", { name: "Selected rows" })).not.toBeInTheDocument()
  })
})

describe("bulk actions", () => {
  test("Confirm selected patches every selected date that is not confirmed", async () => {
    const watcher = watchExamRequests()
    const { user } = renderAdmin(<ExamsPage />, { route: "/exams/" })
    const table = await screen.findByRole("table")
    await within(table).findByText("Mechanics")

    const confirmable = screen.getAllByRole("button", { name: /^Confirm .* on / })
    expect(confirmable.length).toBeGreaterThan(0)
    await user.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }))
    const bar = await screen.findByRole("region", { name: "Selected rows" })
    await user.click(within(bar).getByRole("button", { name: "Confirm selected" }))

    await waitUntil(() => watcher.mutations.length >= confirmable.length, "not every date was confirmed")
    expect(watcher.mutations.every((item) => item.method === "PATCH")).toBe(true)
    expect(watcher.mutations.map((item) => item.body)).toEqual(confirmable.map(() => ({ status: "planned" })))
    watcher.stop()
  })

  test("Block selected asks for one reason and blocks each selected user that is not blocked yet", async () => {
    const blocked: { id: string; body: unknown }[] = []
    server.use(
      http.post(apiUrl("/v1/admin/users/:id/block"), async ({ params, request }) => {
        blocked.push({ id: String(params.id), body: await request.json() })
        return HttpResponse.json({})
      }),
    )
    const { user } = renderAdmin(<UsersPage />, { route: "/users/" })

    await screen.findByRole("link", { name: "Brastilov Aleksey Olegovich" })
    await user.click(screen.getByRole("checkbox", { name: "Select Brastilov Aleksey Olegovich" }))
    const bar = await screen.findByRole("region", { name: "Selected rows" })
    await user.click(within(bar).getByRole("button", { name: "Block selected" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Block 1 user?")).toBeInTheDocument()
    setValue(within(dialog).getByLabelText(/^Reason/), "Shared answers")
    const confirm = within(dialog).getByRole("button", { name: "Block" })
    await waitUntil(() => !(confirm as HTMLButtonElement).disabled, "block still disabled")
    await user.click(confirm)

    await waitUntil(() => blocked.length === 1, "no block request")
    expect(blocked[0]).toEqual({ id: ids.student, body: { reason: "Shared answers" } })
    await waitUntil(() => screen.queryByRole("region", { name: "Selected rows" }) === null, "selection kept")
  })
})
