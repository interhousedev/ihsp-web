/** Curator excuses: decide a request, create an exclusion, the journal lock. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ExcusesPage } from "../features/excuses/components/excuses-page"
import { isExcusedLocked } from "../features/attendance/attendance-rules"
import { configureTests, freezeTime, renderStaff, unfreezeTime } from "./helpers"

configureTests()

async function openPending(user: ReturnType<typeof renderStaff>["user"]) {
  await user.click(await screen.findByRole("button", { name: /Brastilov Aleksey/ }))
  return screen.findByRole("dialog")
}

describe("excuses page", () => {
  test("EXC-STAFF-1: approving a pending request posts the decision", async () => {
    const calls: string[] = []
    server.use(
      http.post(apiUrl("/v1/staff/excuses/:id/approve"), ({ params }) => {
        calls.push(String(params.id))
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    const { user } = renderStaff(<ExcusesPage />, { route: "/excuses/" })
    await openPending(user)
    await user.click(await screen.findByRole("button", { name: "Approve" }))
    await user.click(await screen.findByRole("button", { name: "Confirm" }))
    await waitFor(() => expect(calls).toHaveLength(1))
  })

  test("EXC-STAFF-2: rejecting a pending request posts the decision", async () => {
    const calls: string[] = []
    server.use(
      http.post(apiUrl("/v1/staff/excuses/:id/reject"), ({ params }) => {
        calls.push(String(params.id))
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    const { user } = renderStaff(<ExcusesPage />, { route: "/excuses/" })
    await openPending(user)
    await user.click(await screen.findByRole("button", { name: "Reject" }))
    await user.click(await screen.findByRole("button", { name: "Confirm" }))
    await waitFor(() => expect(calls).toHaveLength(1))
  })
})

describe("exclusion form", () => {
  test("EXC-STAFF-4: the exclusion starts today by default", async () => {
    freezeTime()
    try {
      const bodies: { starts_on?: string }[] = []
      server.use(
        http.post(apiUrl("/v1/staff/excuses"), async ({ request }) => {
          bodies.push((await request.json()) as { starts_on?: string })
          return HttpResponse.json({ id: "new" }, { status: 201 })
        }),
      )
      const { user } = renderStaff(<ExcusesPage />, { route: "/excuses/" })
      await user.click(await screen.findByRole("button", { name: "Excuse a student" }))
      await user.click(await screen.findByRole("combobox", { name: "Student" }))
      await user.click((await screen.findAllByRole("option"))[0] as HTMLElement)
      await user.click(await screen.findByRole("combobox", { name: "Type" }))
      await user.click((await screen.findAllByRole("option"))[2] as HTMLElement)
      await user.click(screen.getByRole("button", { name: "Create excuse" }))
      await waitFor(() => expect(bodies).toHaveLength(1))
      expect(bodies[0]?.starts_on).toBe("2026-10-07")
    } finally {
      unfreezeTime()
    }
  })
})

describe("journal lock", () => {
  test("EXC-STAFF-3: an excused absence is locked, others are not", () => {
    expect(isExcusedLocked({ absent: true, excused: true }, true)).toBe(true)
    expect(isExcusedLocked({ absent: true, excused: false }, true)).toBe(false)
    expect(isExcusedLocked({ absent: true, excused: true }, false)).toBe(false)
  })
})
