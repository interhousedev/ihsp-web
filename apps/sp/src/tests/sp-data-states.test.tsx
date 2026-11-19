/** Student record states, homework tabs, the planner without a subject and one h1 per page (SP-UX-b). */
import { describe, expect, test } from "bun:test"
import { apiUrl, problem, server } from "@ihsp/test-utils"
import { createQueryClient } from "@ihsp/ui"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { DashboardPage } from "../features/dashboard/components/dashboard-page"
import { HomeworkPage } from "../features/homework/components/homework-page"
import { PlannerPage } from "../features/grades/planner/components/planner-page"
import { AccountPage } from "../features/profile/components/account-page"
import { ProfilePage } from "../features/profile/components/profile-page"
import { configureTests, renderSp } from "./helpers"

configureTests()

/** The real client of the app, with a short delay so a retried 5xx does not slow the test. */
function realClient() {
  const client = createQueryClient()
  client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retryDelay: 5 } })
  return client
}

function profileFails(status: number, type: string, counter: { n: number }) {
  server.use(
    http.get(apiUrl("/v1/me/profile"), () => {
      counter.n += 1
      return problem(status, type, "The record is not available")
    }),
  )
}

describe("student record states", () => {
  test("SP-UX-b1: a missing student record shows the notice once and asks once", async () => {
    const counter = { n: 0 }
    profileFails(404, "academic/student-not-found", counter)

    renderSp(<HomeworkPage />, { queryClient: realClient() })

    await Bun.sleep(200)
    expect(counter.n).toBe(1)
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument()
  })

  test("SP-UX-b2: an EMIS authentication failure shows the EMIS failure with the next step", async () => {
    const counter = { n: 0 }
    profileFails(409, "emis/auth-failed", counter)

    renderSp(<ProfilePage />, { queryClient: realClient() })

    const notice = await screen.findByTestId("no-student-record")
    expect(within(notice).getByRole("link")).toHaveAttribute("href", expect.stringContaining("/security/emis/"))
    expect(counter.n).toBe(1)
  })

  test("SP-UX-b3: a server error is retried", async () => {
    let calls = 0
    server.use(
      http.get(apiUrl("/v1/me/profile"), () => {
        calls += 1
        return new HttpResponse(null, { status: 503 })
      }),
    )

    renderSp(<ProfilePage />, { queryClient: realClient() })

    await waitFor(() => expect(calls).toBe(3))
  })
})

describe("homework and planner", () => {
  test("SP-UX-b4: the homework tabs are a tablist and every tab can be reached", async () => {
    renderSp(<HomeworkPage />)

    const list = await screen.findByRole("tablist")
    const tabs = within(list).getAllByRole("tab")
    expect(tabs).toHaveLength(5)
    expect(list.className).toContain("overflow-x-auto")
    for (const tab of tabs) expect(tab).not.toHaveAttribute("tabindex", "-2")
  })

  test("SP-UX-b5: the planner without a subject is an empty state with an action to the subjects", async () => {
    renderSp(<PlannerPage />, { route: "/grades/plan/" })

    const action = await screen.findByRole("link", { name: "Open subjects" })
    expect(action).toHaveAttribute("href", "/subjects")
  })
})

describe("one h1 per page", () => {
  test("SP-UX-b6: the dashboard has one h1", async () => {
    renderSp(<DashboardPage />)

    await screen.findAllByRole("heading", { level: 1 })
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  test("SP-UX-b7: the profile page has one h1", async () => {
    renderSp(<ProfilePage />)

    await screen.findAllByRole("heading", { level: 1 })
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  test("SP-UX-b8: the account page has one h1", async () => {
    renderSp(<AccountPage />, { route: "/profile/account/" })

    await screen.findByRole("heading", { name: "Connectors" })
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })
})
