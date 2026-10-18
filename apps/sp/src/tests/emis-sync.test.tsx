/** Settings: the student re-syncs teachers, lessons, subgroup and marks from EMIS; the sync record shows its progress. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { EmisSyncSection } from "../features/settings/components/emis-sync-section"
import { configureTests, renderSp } from "./helpers"

configureTests()

const base = {
  user_id: "00000000-0000-4000-8000-000000000001",
  requested_at: "2026-10-06T09:00:00Z",
  next_attempt_at: null,
  max_attempts: 6,
}

describe("EMIS re-sync", () => {
  test("the button queues a sync and shows it as pending", async () => {
    const { user } = renderSp(<EmisSyncSection />, { route: "/settings/" })

    await user.click(await screen.findByRole("button", { name: "Re-sync teachers, lessons and marks" }))

    expect(await screen.findByText(/Queued/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Re-sync teachers, lessons and marks" })).toBeDisabled()
  })

  test("a succeeded sync shows the subgroup, the marks count and the finish time", async () => {
    server.use(
      http.get(apiUrl("/v1/me/sync"), () =>
        HttpResponse.json({
          ...base,
          status: "succeeded",
          attempts: 1,
          finished_at: "2026-10-06T09:01:00Z",
          last_error: null,
          subgroup: 2,
          marks_count: 14,
        }),
      ),
    )

    renderSp(<EmisSyncSection />, { route: "/settings/" })

    expect(await screen.findByText(/Subgroup: 2/)).toBeInTheDocument()
    expect(screen.getByText(/marks synced: 14/)).toBeInTheDocument()
    expect(screen.getByText(/Finished:/)).toBeInTheDocument()
  })

  test("a failed sync shows the attempts and the reason", async () => {
    server.use(
      http.get(apiUrl("/v1/me/sync"), () =>
        HttpResponse.json({
          ...base,
          status: "failed",
          attempts: 2,
          finished_at: "2026-10-06T09:01:00Z",
          last_error: "EMIS down",
          subgroup: null,
          marks_count: null,
        }),
      ),
    )

    renderSp(<EmisSyncSection />, { route: "/settings/" })

    expect(await screen.findByText(/Reason: EMIS down/)).toBeInTheDocument()
    expect(screen.getByText(/attempt 2 of 6/)).toBeInTheDocument()
  })
})
