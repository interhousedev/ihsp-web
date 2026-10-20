/** WO-8: the admin statistics of work-off tasks, tabs by subject, teacher, group and student, and the drill-down. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, ids, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { WorkOffsPage } from "../features/work-offs/components/work-offs-page"
import { configureTests, pickDate, renderAdmin, waitUntil } from "./helpers"

configureTests()

let stats: URLSearchParams[]
let lists: URLSearchParams[]
let stop: () => void
beforeEach(() => {
  stats = []
  lists = []
  const listener = ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    if (url.pathname.endsWith("/v1/admin/work-offs/stats")) stats.push(url.searchParams)
    else if (url.pathname.endsWith("/v1/admin/work-offs")) lists.push(url.searchParams)
  }
  server.events.on("request:start", listener)
  stop = () => server.events.removeListener("request:start", listener)
})
afterEach(() => stop())

const last = (list: URLSearchParams[]) => list[list.length - 1]

describe("work-off statistics", () => {
  test("opens on the subject tab with the last 30 days and lists the open count first", async () => {
    renderAdmin(<WorkOffsPage />, { route: "/work-offs/" })

    const table = await screen.findByRole("table")
    const rows = within(table).getAllByRole("row")
    expect(within(rows[1]!).getByText("Mathematics")).toBeInTheDocument()
    expect(within(rows[1]!).getByText("4")).toBeInTheDocument()
    expect(screen.getByText("Open in total: 5")).toBeInTheDocument()
    const params = last(stats)!
    expect(params.get("group_by")).toBe("subject")
    const days = (Date.parse(params.get("to")!) - Date.parse(params.get("from")!)) / 86_400_000
    expect(days).toBe(30)
  })

  test("a tab sends its group_by", async () => {
    const { user } = renderAdmin(<WorkOffsPage />, { route: "/work-offs/" })
    await screen.findByRole("table")

    await user.click(screen.getByRole("tab", { name: "By teacher" }))
    await waitUntil(() => last(stats)?.get("group_by") === "teacher")
    expect(await screen.findByText("Smirnova Olga")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "By group" }))
    await waitUntil(() => last(stats)?.get("group_by") === "group")

    await user.click(screen.getByRole("tab", { name: "By student" }))
    await waitUntil(() => last(stats)?.get("group_by") === "student")
    expect(await screen.findByText("Ivanova Maria")).toBeInTheDocument()
  })

  test("the date range reaches the API", async () => {
    const { user } = renderAdmin(<WorkOffsPage />, { route: "/work-offs/?from=2026-10-01&to=2026-10-31" })
    await screen.findByRole("table")
    expect(last(stats)?.get("from")).toBe("2026-10-01")

    await pickDate(user, screen.getByRole("button", { name: "From date" }), "2026-10-05")

    await waitUntil(() => last(stats)?.get("from") === "2026-10-05" && last(stats)?.get("to") === "2026-10-31")
  })

  test("a row opens the open work-offs of that key", async () => {
    const { user } = renderAdmin(<WorkOffsPage />, { route: "/work-offs/?from=2026-10-01&to=2026-10-31" })

    await user.click(await screen.findByRole("button", { name: "Mathematics" }))

    await waitUntil(() => last(lists)?.get("subject_id") === ids.math)
    expect(last(lists)?.get("status")).toBe("open")
    expect(last(lists)?.get("from")).toBe("2026-10-01")
    expect(last(lists)?.get("limit")).toBe("20")
    expect(await screen.findByText("Redo exercises 4 to 9")).toBeInTheDocument()
    expect(screen.queryByText("Learn the theorem")).not.toBeInTheDocument()
  })

  test("the status filter switches to done and all", async () => {
    const { user } = renderAdmin(<WorkOffsPage />, { route: "/work-offs/?from=2026-10-01&to=2026-10-31" })
    await user.click(await screen.findByRole("button", { name: "Mathematics" }))
    await screen.findByText("Redo exercises 4 to 9")

    await user.click(screen.getByRole("button", { name: "Done" }))
    await waitUntil(() => last(lists)?.get("status") === "done")
    expect(await screen.findByText("Learn the theorem")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "All" }))
    await waitUntil(() => last(lists)?.get("status") === "all")
  })

  test("a student row filters by student_id", async () => {
    const { user } = renderAdmin(<WorkOffsPage />, { route: "/work-offs/?by=student" })

    await user.click(await screen.findByRole("button", { name: "Ivanova Maria" }))

    await waitUntil(() => last(lists)?.get("student_id") === ids.student2)
  })

  test("shows an empty state when there are no work-offs", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/work-offs/stats"), () =>
        HttpResponse.json({ group_by: "subject", from: "2026-10-01", to: "2026-10-31", total_open: 0, rows: [] }),
      ),
    )
    renderAdmin(<WorkOffsPage />, { route: "/work-offs/" })

    expect(await screen.findByText("No work-off tasks in this period.")).toBeInTheDocument()
  })
})
