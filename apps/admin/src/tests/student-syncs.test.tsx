/** Monitoring: the students whose initial EMIS sync failed are listed first. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { StudentSyncs } from "../features/monitoring/components/student-syncs"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

const row = (user_id: string, status: string, last_error: string | null = null) => ({
  user_id,
  status,
  attempts: status === "failed" ? 6 : 1,
  max_attempts: 6,
  requested_at: "2026-10-06T09:00:00Z",
  next_attempt_at: null,
  finished_at: "2026-10-06T09:01:00Z",
  last_error,
  subgroup: null,
  marks_count: null,
})

describe("student syncs", () => {
  test("lists the failed syncs with their reason", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/sync/student-syncs"), ({ request }) => {
        const status = new URL(request.url).searchParams.get("status")
        if (status === "failed")
          return HttpResponse.json([row("11111111-1111-4111-8111-111111111111", "failed", "EMIS down")])
        return HttpResponse.json([])
      }),
    )

    renderAdmin(<StudentSyncs />, { route: "/monitoring/" })

    const table = await screen.findByRole("table")
    expect(within(table).getByText("EMIS down")).toBeInTheDocument()
    expect(within(table).getByText("6 of 6")).toBeInTheDocument()
  })

  test("says so when nothing is failed, pending or running", async () => {
    server.use(http.get(apiUrl("/v1/admin/sync/student-syncs"), () => HttpResponse.json([])))

    renderAdmin(<StudentSyncs />, { route: "/monitoring/" })

    expect(await screen.findByText(/No student sync is failed/)).toBeInTheDocument()
  })
})
