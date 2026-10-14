/** Settings: the student re-syncs teachers, lessons and marks from EMIS (POST /v1/me/sync, once per ten minutes). */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { EmisSyncSection } from "../features/settings/components/emis-sync-section"
import { configureTests, renderSp } from "./helpers"

configureTests()

describe("EMIS re-sync", () => {
  test("the button queues a sync and shows that it is queued", async () => {
    const { user } = renderSp(<EmisSyncSection />, { route: "/settings/" })

    await user.click(await screen.findByRole("button", { name: "Re-sync teachers, lessons and marks" }))

    expect(await screen.findByText("Queued…")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Re-sync teachers, lessons and marks" })).toBeDisabled()
  })

  test("the last finished sync shows its time", async () => {
    server.use(
      http.get(apiUrl("/v1/me/sync"), () =>
        HttpResponse.json({
          status: "done",
          requested_at: "2026-10-06T09:00:00Z",
          finished_at: "2026-10-06T09:01:00Z",
          detail: "synced",
        }),
      ),
    )

    renderSp(<EmisSyncSection />, { route: "/settings/" })

    expect(await screen.findByText(/Last synced/)).toBeInTheDocument()
  })

  test("a second click within ten minutes says when to try again", async () => {
    server.use(
      http.get(apiUrl("/v1/me/sync"), () =>
        HttpResponse.json({
          status: "done",
          requested_at: "2026-10-06T09:00:00Z",
          finished_at: "2026-10-06T09:01:00Z",
          detail: "synced",
        }),
      ),
      http.post(apiUrl("/v1/me/sync"), () =>
        HttpResponse.json(
          { type: "common/rate-limited", title: "Too many", status: 429, params: { retry_after: 540 } },
          { status: 429, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user } = renderSp(<EmisSyncSection />, { route: "/settings/" })

    await user.click(await screen.findByRole("button", { name: "Re-sync teachers, lessons and marks" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Try again in 9 min.")
  })
})
