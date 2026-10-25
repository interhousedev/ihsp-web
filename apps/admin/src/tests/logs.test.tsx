/** Logs (admin): the error-tracker issues, their level, link and the disabled and empty states. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { LogsPage } from "../features/logs/components/logs-page"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

describe("logs", () => {
  test("lists the issues with their level, count, project and a link to the issue", async () => {
    renderAdmin(<LogsPage />)

    expect(await screen.findByText("TypeError: Cannot read properties of undefined (reading 'id')")).toBeInTheDocument()
    expect(screen.getByText("Error")).toBeInTheDocument()
    expect(screen.getByText("Warning")).toBeInTheDocument()
    expect(screen.getByText("42 events")).toBeInTheDocument()
    expect(screen.getAllByText("ihsp-web").length).toBeGreaterThan(0)
    const [first] = screen.getAllByRole("link", { name: "Open issue" })
    expect(first?.getAttribute("href")).toBe("https://bugsink.example.test/issues/issue-1/")
    expect(first?.getAttribute("target")).toBe("_blank")
    expect(first?.getAttribute("rel")).toBe("noopener noreferrer")
  })

  test("says that error tracking is not configured when the backend reports it disabled", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/logs/issues"), () =>
        HttpResponse.json({ items: [], page: 1, size: 20, has_next: false, projects: [], disabled: true }),
      ),
    )
    renderAdmin(<LogsPage />)

    expect(
      await screen.findByText("Error tracking is not configured on this server, so there are no issues to show."),
    ).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Open issue" })).toBeNull()
  })

  test("an enabled tracker with no issues says so", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/logs/issues"), () =>
        HttpResponse.json({ items: [], page: 1, size: 20, has_next: false, projects: [], disabled: false }),
      ),
    )
    renderAdmin(<LogsPage />)

    expect(await screen.findByText("No issues match these filters.")).toBeInTheDocument()
  })
})
