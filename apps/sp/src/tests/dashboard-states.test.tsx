/** The Today dashboard: a skeleton while the layout loads, an error with retry, and a draft kept when saving fails. */
import { describe, expect, test } from "bun:test"
import { apiUrl, dashboardLayout, problem, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { Dashboard } from "../features/today/dashboard/dashboard"
import { configureTests, renderSp } from "./helpers"

configureTests()

describe("Dashboard states", () => {
  test("shows a loading skeleton while the layout loads", async () => {
    server.use(http.get(apiUrl("/v1/me/dashboard"), () => new Promise<Response>(() => {})))
    const { container } = renderSp(<Dashboard />)

    expect(await screen.findByRole("status", { name: "Loading" })).toHaveAttribute("aria-busy", "true")
    expect(container.querySelector("[data-widget-kind]")).toBeNull()
  })

  test("shows an error with a retry button, and retry loads the layout", async () => {
    let calls = 0
    server.use(
      http.get(apiUrl("/v1/me/dashboard"), () => {
        calls += 1
        return calls === 1 ? problem(500, "internal", "Server error") : HttpResponse.json(dashboardLayout)
      }),
    )
    const { user } = renderSp(<Dashboard />)

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByRole("heading", { name: "My widgets" })).toBeInTheDocument()
    expect(calls).toBe(2)
  })

  test("a failed save keeps the edit draft and shows an error", async () => {
    server.use(http.put(apiUrl("/v1/me/dashboard"), () => problem(500, "internal", "Server error")))
    const { user } = renderSp(<Dashboard />)

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Your changes are kept")
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
  })
})
