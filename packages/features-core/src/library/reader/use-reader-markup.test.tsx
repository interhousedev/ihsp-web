import { describe, expect, it } from "bun:test"
import type { MarkupBody, MarkupShape } from "@ihsp/api"
import { apiUrl, libIds, server } from "@ihsp/test-utils"
import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { useReaderMarkup } from "./use-reader-markup"

const ids = { itemId: libIds.bookPhysics10, fileId: libIds.filePhysics10 }
const line: MarkupShape = {
  id: "s1",
  tool: "pen",
  color: "#e53935",
  width: 0.005,
  points: [
    [0.1, 0.1],
    [0.5, 0.4],
  ],
}

/** A one-user store behind the markup endpoints; `puts` counts the writes. */
function store(initial: MarkupBody | null = null) {
  const state = { doc: initial, puts: 0 }
  server.use(
    http.get(apiUrl("/v1/me/library/markup/:itemId"), () =>
      HttpResponse.json({
        item_id: ids.itemId,
        file_id: state.doc?.file_id ?? null,
        pages: state.doc?.pages ?? {},
        updated_at: null,
      }),
    ),
    http.put(apiUrl("/v1/me/library/markup/:itemId"), async ({ request }) => {
      state.puts += 1
      state.doc = (await request.json()) as MarkupBody
      return HttpResponse.json({ item_id: ids.itemId, ...state.doc, updated_at: "2026-01-01T00:00:00Z" })
    }),
  )
  return state
}

describe("useReaderMarkup", () => {
  it("saves the drawings and loads them for the next visit", async () => {
    const backend = store()
    const first = renderHook(() => useReaderMarkup({ ...ids, signedIn: true }))
    act(() => first.result.current.add(2, line))
    expect(first.result.current.unsaved).toBe(true)
    await act(async () => {
      expect(await first.result.current.save()).toBe(true)
    })
    expect(backend.doc?.pages["2"]).toEqual([line])
    expect(first.result.current.unsaved).toBe(false)

    const second = renderHook(() => useReaderMarkup({ ...ids, signedIn: true }))
    await waitFor(() => expect(second.result.current.pages[2]).toEqual([line]))
    expect(second.result.current.dirty).toBe(false)
  })

  it("ignores drawings made on another file", async () => {
    store({ file_id: "00000000-0000-4000-8000-000000000000", pages: { "1": [line] } })
    const { result } = renderHook(() => useReaderMarkup({ ...ids, signedIn: true }))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(result.current.pages).toEqual({})
  })

  it("keeps temporary drawings in memory, never sends them and asks before leaving", async () => {
    const backend = store()
    const { result } = renderHook(() => useReaderMarkup({ ...ids, signedIn: false }))
    expect(result.current.temporary).toBe(true)
    act(() => result.current.add(1, line))
    expect(result.current.dirty).toBe(true)
    await act(async () => {
      expect(await result.current.save()).toBe(false)
    })
    expect(backend.puts).toBe(0)
    act(() => result.current.discard())
    expect(result.current.pages).toEqual({})
    expect(result.current.dirty).toBe(false)
  })

  it("undoes and redoes", () => {
    store()
    const { result } = renderHook(() => useReaderMarkup({ ...ids, signedIn: false }))
    act(() => result.current.add(1, line))
    act(() => result.current.undo())
    expect(result.current.pages[1] ?? []).toEqual([])
    act(() => result.current.redo())
    expect(result.current.pages[1]).toEqual([line])
  })
})
