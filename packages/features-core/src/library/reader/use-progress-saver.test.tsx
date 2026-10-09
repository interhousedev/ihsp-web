import { describe, expect, it } from "bun:test"
import { apiUrl, libIds, server } from "@ihsp/test-utils"
import { renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { readStoredFraction, readStoredPosition } from "./lib/locator"
import { useProgressSaver } from "./use-progress-saver"

type Body = { file_id: string; locator: unknown; percent: number; client_ts: string; seconds_read?: number }

function capture() {
  const bodies: Body[] = []
  server.use(
    http.put(apiUrl("/v1/me/library/progress/:itemId"), async ({ request }) => {
      bodies.push((await request.json()) as Body)
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return bodies
}

const ids = { itemId: libIds.bookPhysics10, fileId: libIds.filePhysics10 }

describe("useProgressSaver", () => {
  it("sends the first position at once and no more than one write per interval", async () => {
    const bodies = capture()
    const { result } = renderHook(() => useProgressSaver({ ...ids, enabled: true, intervalMs: 300 }))

    result.current.report({ page: 1 }, 0.01)
    result.current.report({ page: 2 }, 0.02)
    result.current.report({ page: 3 }, 0.03)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ locator: { page: 1 }, file_id: libIds.filePhysics10, percent: 1 })
    // The later positions wait for the interval and go out as one write with the newest place.
    await waitFor(() => expect(bodies).toHaveLength(2), { timeout: 2000 })
    expect(bodies[1]).toMatchObject({ locator: { page: 3 }, percent: 3 })
  })

  it("writes the newest position when the reader closes", async () => {
    const bodies = capture()
    const { result, unmount } = renderHook(() => useProgressSaver({ ...ids, enabled: true, intervalMs: 60_000 }))
    result.current.report({ page: 4 }, 0.04)
    await waitFor(() => expect(bodies).toHaveLength(1))

    result.current.report({ page: 9 }, 0.09)
    unmount()

    await waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies[1]).toMatchObject({ locator: { page: 9 }, percent: 9 })
  })

  it("writes when the page is hidden", async () => {
    const bodies = capture()
    const { result } = renderHook(() => useProgressSaver({ ...ids, enabled: true, intervalMs: 60_000 }))
    result.current.report({ page: 4 }, 0.04)
    await waitFor(() => expect(bodies).toHaveLength(1))
    result.current.report({ page: 5 }, 0.05)

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" })
    document.dispatchEvent(new Event("visibilitychange"))
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" })

    await waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies[1]?.locator).toEqual({ page: 5 })
  })

  it("sends a CFI position with its progress", async () => {
    const bodies = capture()
    const { result } = renderHook(() => useProgressSaver({ ...ids, enabled: true }))

    result.current.report({ cfi: "epubcfi(/6/8!/4/2)", progress: 0.4 }, 0.4)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ locator: { cfi: "epubcfi(/6/8!/4/2)", progress: 0.4 }, percent: 40 })
  })

  it("keeps the place on this device but sends nothing for a visitor", async () => {
    const bodies = capture()
    const { result, unmount } = renderHook(() => useProgressSaver({ ...ids, enabled: false }))

    result.current.report({ page: 7 }, 0.3)
    unmount()
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(bodies).toHaveLength(0)
    expect(readStoredPosition(ids.itemId, ids.fileId)).toEqual({ page: 7 })
    expect(readStoredFraction(ids.itemId, ids.fileId)).toBe(0.3)
  })

  it("stops asking when the server says the item cannot hold progress", async () => {
    let calls = 0
    server.use(
      http.put(apiUrl("/v1/me/library/progress/:itemId"), () => {
        calls += 1
        return HttpResponse.json(
          {
            type: "library/not-supported",
            title: "Not supported",
            status: 409,
            message_key: "errors.library.not-supported",
          },
          { status: 409, headers: { "Content-Type": "application/problem+json" } },
        )
      }),
    )
    const { result } = renderHook(() => useProgressSaver({ ...ids, enabled: true, intervalMs: 20 }))

    result.current.report({ page: 1 }, 0.1)
    await waitFor(() => expect(calls).toBe(1))
    await new Promise((resolve) => setTimeout(resolve, 50))
    result.current.report({ page: 2 }, 0.2)
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(calls).toBe(1)
  })
})
