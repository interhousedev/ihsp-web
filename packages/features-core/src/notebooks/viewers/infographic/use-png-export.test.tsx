import { describe, expect, it, mock } from "bun:test"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createRef } from "react"
import { usePngExport } from "./use-png-export"

function setup(overrides: Partial<Parameters<typeof usePngExport>[0]> = {}) {
  const node = document.createElement("div")
  const canvasRef = createRef<HTMLElement>()
  ;(canvasRef as { current: HTMLElement | null }).current = node
  const blob = new Blob(["png"], { type: "image/png" })
  const render = mock(() => Promise.resolve(blob))
  const save = mock((_fileName: string, _blob: Blob) => undefined)
  const onFallback = mock(() => undefined)
  const hook = renderHook(() =>
    usePngExport({
      canvasRef,
      width: 800,
      height: 1200,
      fileName: "photosynthesis.png",
      onFallback,
      render,
      save,
      ...overrides,
    }),
  )
  return { hook, node, blob, render, save, onFallback }
}

describe("usePngExport", () => {
  it("renders the canvas at 2x and saves the picture under the file name", async () => {
    const { hook, node, blob, render, save, onFallback } = setup()

    await act(() => hook.result.current.run())

    expect(render).toHaveBeenCalledWith(node, { width: 800, height: 1200, scale: 2 })
    expect(save).toHaveBeenCalledWith("photosynthesis.png", blob)
    expect(onFallback).not.toHaveBeenCalled()
    expect(hook.result.current.failed).toBe(false)
    expect(hook.result.current.busy).toBe(false)
  })

  it("is busy while the picture is being made", async () => {
    const pending = Promise.withResolvers<Blob>()
    const render = mock(() => pending.promise)
    const { hook, save } = setup({ render })

    act(() => void hook.result.current.run())
    await waitFor(() => expect(hook.result.current.busy).toBe(true))
    await act(async () => pending.resolve(new Blob(["x"])))

    await waitFor(() => expect(hook.result.current.busy).toBe(false))
    expect(save).toHaveBeenCalledTimes(1)
  })

  it("reports the failure and falls back when the browser cannot render the picture", async () => {
    const render = mock(() => Promise.reject(new Error("tainted")))
    const { hook, save, onFallback } = setup({ render })

    await act(() => hook.result.current.run())

    expect(save).not.toHaveBeenCalled()
    expect(onFallback).toHaveBeenCalledTimes(1)
    expect(hook.result.current.failed).toBe(true)
    expect(hook.result.current.busy).toBe(false)
  })
})
