/** Monitoring: a running sync run or a running student sync can be stopped after a confirm. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { StudentSyncs } from "../features/monitoring/components/student-syncs"
import { SyncTab } from "../features/monitoring/components/sync-tab"
import { configureTests, renderAdmin, waitUntil } from "./helpers"

configureTests()

const STUDENT = "11111111-1111-4111-8111-111111111111"
const RUN = "22222222-2222-4222-8222-222222222222"

const studentRow = {
  user_id: STUDENT,
  status: "running",
  attempts: 1,
  max_attempts: 6,
  requested_at: "2026-10-06T09:00:00Z",
  next_attempt_at: null,
  finished_at: null,
  last_error: null,
  subgroup: null,
  marks_count: null,
}

const runningRun = {
  id: RUN,
  started_at: "2026-10-06T09:00:00Z",
  finished_at: null,
  status: "running",
  stats: {},
}

function captureStop(path: string): { hit: boolean } {
  const seen = { hit: false }
  server.use(
    http.post(apiUrl(path), () => {
      seen.hit = true
      return new HttpResponse(null, { status: 202 })
    }),
  )
  return seen
}

describe("stop a running student sync", () => {
  test("Stop asks for a confirm, then posts the stop", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/sync/student-syncs"), ({ request }) => {
        const status = new URL(request.url).searchParams.get("status")
        return HttpResponse.json(status === "running" ? [studentRow] : [])
      }),
    )
    const seen = captureStop(`/v1/admin/sync/student-syncs/${STUDENT}/stop`)
    renderAdmin(<StudentSyncs />, { route: "/monitoring/" })

    const table = await screen.findByRole("table")
    fireEvent.click(within(table).getByRole("button", { name: "Stop" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(seen.hit).toBe(false)
    fireEvent.click(within(dialog).getByRole("button", { name: "Stop sync" }))

    await waitUntil(() => seen.hit)
  })

  test("a finished student sync has no Stop", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/sync/student-syncs"), ({ request }) => {
        const status = new URL(request.url).searchParams.get("status")
        return HttpResponse.json(
          status === "failed" ? [{ ...studentRow, status: "failed", last_error: "EMIS down" }] : [],
        )
      }),
    )
    renderAdmin(<StudentSyncs />, { route: "/monitoring/" })

    const table = await screen.findByRole("table")
    expect(within(table).queryByRole("button", { name: "Stop" })).toBeNull()
  })
})

describe("stop a running sync run", () => {
  test("the running run has Stop; confirm posts the stop of that run", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/sync/runs"), () => HttpResponse.json({ items: [runningRun], next_cursor: null })),
      http.get(apiUrl("/v1/admin/sync/student-syncs"), () => HttpResponse.json([])),
    )
    const seen = captureStop(`/v1/admin/sync/runs/${RUN}/stop`)
    renderAdmin(<SyncTab />, { route: "/monitoring/" })

    fireEvent.click(await screen.findByRole("button", { name: "Stop" }))
    const dialog = await screen.findByRole("alertdialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Stop run" }))

    await waitUntil(() => seen.hit)
  })
})
