/** The Home page (`/`): the student's widget grid, the only Today-style page; `/today/` redirects here. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
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
})
