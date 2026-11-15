/** The Home page (`/`): the student's widget grid, the only Today-style page; `/today/` redirects here. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { act, screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { DashboardPage } from "../features/dashboard/components/dashboard-page"
import { configureTests, findCard, freezeTime, renderSp, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

describe("Home", () => {
  test("shows the student's widget grid, with the lessons and the semester among the widgets", async () => {
    renderSp(<DashboardPage />)

    expect(await screen.findByRole("region", { name: "My widgets" })).toBeInTheDocument()
    expect(await findCard("Next lesson")).toBeInTheDocument()
    expect(await findCard("Semester 4")).toBeInTheDocument()
  })

  test("shows an error with a retry when the widgets fail", async () => {
    server.use(http.get(apiUrl("/v1/me/dashboard"), () => HttpResponse.json({}, { status: 500 })))
    renderSp(<DashboardPage />)

    expect(await screen.findByRole("button", { name: /try again/i })).toBeInTheDocument()
  })

  test("shows the header with the three stat tiles, the lessons section and the tile grid", async () => {
    renderSp(<DashboardPage />)

    expect(await screen.findByTestId("home-header")).toBeInTheDocument()
    const stats = screen.getByTestId("home-stats")
    expect(stats.textContent).toContain("Rating")
    expect(stats.textContent).toContain("-")
    const all = await screen.findByRole("link", { name: "All" })
    expect(all.getAttribute("href")).toMatch(/^\/timetable\/?$/)
    const nav = screen.getByRole("navigation", { name: "Sections" })
    expect(nav.querySelectorAll("a").length).toBeGreaterThanOrEqual(8)
    expect(screen.getByRole("button", { name: "Student card" })).toBeInTheDocument()
  })

  test("the compact bar appears after scrolling", async () => {
    renderSp(<DashboardPage />)
    const bar = await screen.findByTestId("home-compact-bar")
    expect(bar).toHaveAttribute("data-compact", "false")

    Object.defineProperty(window, "scrollY", { value: 400, configurable: true })
    await act(async () => {
      window.dispatchEvent(new Event("scroll"))
    })
    expect(screen.getByTestId("home-compact-bar")).toHaveAttribute("data-compact", "true")
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true })
  })
})
