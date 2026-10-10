/** Reports: system health, usage and academic charts read from GET /v1/admin/insights. */
import { describe, expect, test } from "bun:test"
import { apiUrl, insights, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ReportsPage } from "../features/reports/components/reports-page"
import { formatBytes, formatCount, percent, share } from "../features/reports/utils"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

describe("reports utils", () => {
  test("formats bytes, counts and shares", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(5_368_709_120)).toBe("5.0 GB")
    expect(formatCount(120_000)).toBe("120k")
    expect(formatCount(1_200_000)).toBe("1.2M")
    expect(percent(0.974)).toBe(97)
    expect(percent(null)).toBeNull()
    expect(share(10, 100)).toBe(10)
    expect(share(1, 0)).toBe(0)
  })
})

describe("reports page", () => {
  test("the system tab shows the services, the queue and the failed sign-in share", async () => {
    renderAdmin(<ReportsPage />, { route: "/reports/" })

    expect(await screen.findByText("Database")).toBeInTheDocument()
    expect(screen.getAllByText("Up")).toHaveLength(2)
    expect(screen.getByText("Jobs waiting")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("10%")).toBeInTheDocument()
    expect(screen.getByText("10 of 100 attempts")).toBeInTheDocument()
  })

  test("a service that is down is marked", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/insights"), () =>
        HttpResponse.json({ ...insights, system: { ...insights.system, redis: false, queue_lag: null } }),
      ),
    )
    renderAdmin(<ReportsPage />, { route: "/reports/" })

    expect(await screen.findByText("Down")).toBeInTheDocument()
  })

  test("the usage tab shows storage and the two daily charts", async () => {
    renderAdmin(<ReportsPage />, { route: "/reports/?tab=usage" })

    expect(await screen.findByText("5.0 GB")).toBeInTheDocument()
    expect(screen.getByText("321 files")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Active users per day" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Assistant tokens per day" })).toBeInTheDocument()
  })

  test("the academic tab shows the marks distribution", async () => {
    renderAdmin(<ReportsPage />, { route: "/reports/?tab=academic" })

    expect(await screen.findByRole("img", { name: "Marks distribution" })).toBeInTheDocument()
    expect(await screen.findByRole("img", { name: "Attendance by group" })).toBeInTheDocument()
  })

  test("an empty marks table shows a message", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/insights"), () =>
        HttpResponse.json({ ...insights, marks: { distribution: { "2": 0, "3": 0, "4": 0, "5": 0 } } }),
      ),
    )
    renderAdmin(<ReportsPage />, { route: "/reports/?tab=academic" })

    expect(await screen.findByText("No marks yet.")).toBeInTheDocument()
  })
})
