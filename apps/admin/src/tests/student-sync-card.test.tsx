/** ADM-3 Overview: the admin re-syncs one student from EMIS (confirm, status, idempotent button). */
import { describe, expect, test } from "bun:test"
import type { MeSyncStatus } from "@ihsp/api"
import { apiUrl, ids, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { StudentSyncCard } from "../features/students/components/student-sync-card"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

const job = (overrides: Partial<MeSyncStatus> = {}): MeSyncStatus => ({
  user_id: ids.student,
  status: "pending",
  attempts: 0,
  max_attempts: 6,
  requested_at: "2026-10-06T09:00:00Z",
  next_attempt_at: null,
  finished_at: null,
  last_error: null,
  subgroup: null,
  marks_count: null,
  ...overrides,
})

const button = () => screen.getByRole("button", { name: "Sync EMIS (marks, teachers, lessons)" })

describe("student EMIS sync card", () => {
  test("says the student was never synced and the button starts the sync after confirm", async () => {
    const posts: string[] = []
    let current: MeSyncStatus | null = null
    server.use(
      http.get(apiUrl("/v1/admin/students/:userId/sync"), () => HttpResponse.json(current)),
      http.post(apiUrl("/v1/admin/students/:userId/sync"), ({ params }) => {
        posts.push(String(params.userId))
        current = job()
        return HttpResponse.json(job(), { status: 202 })
      }),
    )
    renderAdmin(<StudentSyncCard userId={ids.student} />, { route: "/students/view/" })

    expect(await screen.findByText("Not synced yet")).toBeInTheDocument()
    fireEvent.click(button())
    fireEvent.click(await screen.findByRole("button", { name: "Start sync" }))

    await waitFor(() => expect(posts).toEqual([ids.student]))
    expect(await screen.findByText("Queued")).toBeInTheDocument()
  })

  test("cancelling the confirm sends nothing", async () => {
    const posts: string[] = []
    server.use(
      http.get(apiUrl("/v1/admin/students/:userId/sync"), () => HttpResponse.json(null)),
      http.post(apiUrl("/v1/admin/students/:userId/sync"), () => {
        posts.push("posted")
        return HttpResponse.json(job(), { status: 202 })
      }),
    )
    renderAdmin(<StudentSyncCard userId={ids.student} />, { route: "/students/view/" })
    await screen.findByText("Not synced yet")

    fireEvent.click(button())
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("button", { name: "Start sync" })).toBeNull())
    expect(posts).toEqual([])
  })

  test("a running sync shows its attempt and disables the button", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/students/:userId/sync"), () =>
        HttpResponse.json(job({ status: "running", attempts: 2 })),
      ),
    )
    renderAdmin(<StudentSyncCard userId={ids.student} />, { route: "/students/view/" })

    expect(await screen.findByText("Running")).toBeInTheDocument()
    expect(screen.getByText("Attempt 2 of 6")).toBeInTheDocument()
    expect(button()).toBeDisabled()
  })

  test("a failed sync shows the last error and when it finished", async () => {
    server.use(
      http.get(apiUrl("/v1/admin/students/:userId/sync"), () =>
        HttpResponse.json(
          job({
            status: "failed",
            attempts: 6,
            last_error: "EMIS down",
            finished_at: "2026-10-06T09:05:00Z",
          }),
        ),
      ),
    )
    renderAdmin(<StudentSyncCard userId={ids.student} />, { route: "/students/view/" })

    expect(await screen.findByText("Failed")).toBeInTheDocument()
    expect(screen.getByText("EMIS down")).toBeInTheDocument()
    expect(screen.getByText("Attempt 6 of 6")).toBeInTheDocument()
    expect(button()).not.toBeDisabled()
  })
})
