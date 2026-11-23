import { describe, expect, it } from "bun:test"
import { HTML_WIDGET_SANDBOX, clampWidgetHeight, parseWidgetMessage } from "./html-widget"

const frame = {} as Window
const other = {} as Window
const msg = (data: unknown, source: Window = frame, origin = "null") => ({ data, source, origin }) as MessageEvent

describe("parseWidgetMessage", () => {
  it("accepts a result and a size from the frame", () => {
    expect(parseWidgetMessage(msg({ type: "ihsp-widget-result", score_pct: 80, passed: true }), frame)).toEqual({
      kind: "result",
      scorePct: 80,
      passed: true,
    })
    expect(parseWidgetMessage(msg({ type: "ihsp-widget-size", height: 420.2 }), frame)).toEqual({
      kind: "size",
      height: 421,
    })
  })

  it("rejects forged sources, origins and shapes", () => {
    const good = { type: "ihsp-widget-result", score_pct: 100, passed: true }
    expect(parseWidgetMessage(msg(good, other), frame)).toBeNull()
    expect(parseWidgetMessage(msg(good, frame, "https://evil.example"), frame)).toBeNull()
    expect(parseWidgetMessage(msg(good), null)).toBeNull()
    for (const bad of [
      { ...good, score_pct: 101 },
      { ...good, score_pct: -1 },
      { ...good, score_pct: Number.NaN },
      { ...good, score_pct: "100" },
      { ...good, passed: "yes" },
      { type: "ihsp-widget-size", height: -5 },
      { type: "ihsp-widget-size", height: Number.POSITIVE_INFINITY },
      "ihsp-widget-result",
      null,
    ]) {
      expect(parseWidgetMessage(msg(bad), frame)).toBeNull()
    }
  })

  it("clamps oversized heights", () => {
    expect(parseWidgetMessage(msg({ type: "ihsp-widget-size", height: 1e9 }), frame)).toEqual({
      kind: "size",
      height: 2000,
    })
    expect(clampWidgetHeight(10)).toBe(200)
    expect(clampWidgetHeight(900, 600)).toBe(600)
  })
})

describe("HTML_WIDGET_SANDBOX", () => {
  it("allows scripts only: no popups, same-origin, forms or navigation", () => {
    expect(HTML_WIDGET_SANDBOX).toBe("allow-scripts")
  })
})
