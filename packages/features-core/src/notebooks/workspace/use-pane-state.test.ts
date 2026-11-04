import { beforeEach, describe, expect, it } from "bun:test"
import { act, renderHook } from "@testing-library/react"
import { PANE_STORAGE_KEY, usePaneState } from "./use-pane-state"

describe("usePaneState", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("starts with both side panes expanded when nothing is stored", () => {
    const { result } = renderHook(() => usePaneState())
    expect(result.current.collapsed).toEqual({ sources: false, studio: false })
  })

  it("keeps collapsed side panes across a reload", () => {
    const first = renderHook(() => usePaneState())
    act(() => first.result.current.setCollapsed("studio", true))
    first.unmount()

    const reloaded = renderHook(() => usePaneState())
    expect(reloaded.result.current.collapsed).toEqual({ sources: false, studio: true })
  })

  it("forgets a pane that was expanded again", () => {
    const first = renderHook(() => usePaneState())
    act(() => first.result.current.toggleCollapsed("sources"))
    act(() => first.result.current.toggleCollapsed("sources"))
    first.unmount()

    const reloaded = renderHook(() => usePaneState())
    expect(reloaded.result.current.collapsed).toEqual({ sources: false, studio: false })
  })

  it("ignores a stored value it cannot read", () => {
    window.localStorage.setItem(PANE_STORAGE_KEY, "{not json")
    const { result } = renderHook(() => usePaneState())
    expect(result.current.collapsed).toEqual({ sources: false, studio: false })
  })

  it("does not keep the mobile sheet across a reload", () => {
    const first = renderHook(() => usePaneState())
    act(() => first.result.current.setSheet("studio"))
    first.unmount()

    const reloaded = renderHook(() => usePaneState())
    expect(reloaded.result.current.sheet).toBeNull()
  })
})
