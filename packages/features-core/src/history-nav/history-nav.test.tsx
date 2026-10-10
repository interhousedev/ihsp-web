import { beforeEach, describe, expect, it } from "bun:test"
import { renderWithProviders, setTestRoute, resetTestRouter, testRouter } from "@ihsp/test-utils"
import { act, screen } from "@testing-library/react"
import { HistoryButtons } from "./history-buttons"
import {
  EMPTY_HISTORY,
  HISTORY_CAP,
  canGoBack,
  canGoForward,
  goBack,
  goForward,
  pushEntry,
} from "./use-history-stack"

const e = (n: number | string) => ({ url: `/p${n}/`, title: `Page ${n}` })

describe("history stack", () => {
  it("pushes and moves back and forward", () => {
    let s = pushEntry(pushEntry(pushEntry(EMPTY_HISTORY, e(1)), e(2)), e(3))
    expect(s.index).toBe(2)
    s = goBack(goBack(s))
    expect(s.entries[s.index]).toEqual(e(1))
    expect(canGoBack(s)).toBe(false)
    s = goForward(s)
    expect(s.entries[s.index]).toEqual(e(2))
    expect(canGoForward(s)).toBe(true)
  })

  it("truncates the forward entries on a new push after going back", () => {
    let s = pushEntry(pushEntry(pushEntry(EMPTY_HISTORY, e(1)), e(2)), e(3))
    s = pushEntry(goBack(s), e(4))
    expect(s.entries.map((x) => x.url)).toEqual(["/p1/", "/p2/", "/p4/"])
    expect(canGoForward(s)).toBe(false)
  })

  it("caps at 50 entries, dropping the oldest", () => {
    let s = EMPTY_HISTORY
    for (let i = 0; i < 60; i++) s = pushEntry(s, e(i))
    expect(s.entries).toHaveLength(HISTORY_CAP)
    expect(s.entries[0]).toEqual(e(10))
    expect(s.index).toBe(HISTORY_CAP - 1)
  })

  it("re-visiting the current url only refreshes the title", () => {
    const s = pushEntry(pushEntry(EMPTY_HISTORY, e(1)), { url: "/p1/", title: "New" })
    expect(s.entries).toEqual([{ url: "/p1/", title: "New" }])
  })
})

describe("HistoryButtons", () => {
  beforeEach(() => {
    resetTestRouter()
    window.sessionStorage.clear()
  })

  it("is disabled at both ends of a fresh history", () => {
    setTestRoute("/p1/")
    renderWithProviders(<HistoryButtons />, { route: "/p1/" })
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /forward/i })).toBeDisabled()
  })

  it("enables back after a stored previous page and steps to it", async () => {
    window.sessionStorage.setItem(
      "ihsp:history-nav",
      JSON.stringify({ entries: [e(1), e(2)], index: 1 }),
    )
    renderWithProviders(<HistoryButtons />, { route: "/p2/" })
    const back = await screen.findByRole("button", { name: /back: page 1/i })
    expect(back).not.toBeDisabled()
    expect(screen.getByRole("button", { name: /forward/i })).toBeDisabled()
    await act(async () => back.click())
    expect(testRouter.push).toHaveBeenCalledWith("/p1/")
  })
})
