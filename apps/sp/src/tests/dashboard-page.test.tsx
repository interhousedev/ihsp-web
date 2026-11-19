/** The Home page (`/`): the student's widget grid, the only Today-style page; `/today/` redirects here. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { act, screen, within } from "@testing-library/react"
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

  test("the header is just the student's face, a link to the profile; nothing repeats the navigation", async () => {
    renderSp(<DashboardPage />)

    expect(await screen.findByTestId("home-header")).toBeInTheDocument()
    const face = within(screen.getByTestId("home-header")).getByRole("link", { name: /open profile/i })
    expect(face.getAttribute("href")).toMatch(/^\/profile\/?$/)
    expect(screen.queryByTestId("home-stats")).toBeNull()
    expect(screen.queryByRole("navigation", { name: "Sections" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Student card" })).toBeNull()
  })

  test("the compact bar links the face and the name to the profile", async () => {
    renderSp(<DashboardPage />)
    const bar = await screen.findByTestId("home-compact-bar")
    const link = bar.querySelector("a") as HTMLAnchorElement
    expect(link.getAttribute("href")).toMatch(/^\/profile\/?$/)
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
