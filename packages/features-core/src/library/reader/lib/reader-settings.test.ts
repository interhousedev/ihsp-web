import { describe, expect, it } from "bun:test"
import { DEFAULT_SETTINGS, readSettings, sanitizeSettings, stepZoom } from "./reader-settings"

describe("sanitizeSettings", () => {
  it("keeps valid values", () => {
    const settings = { fontSize: 130, lineHeight: 1.8, pageFit: "page", zoom: 1.5, flow: "scrolled", color: "pink" }

    expect(sanitizeSettings(settings)).toEqual(settings as ReturnType<typeof sanitizeSettings>)
  })

  it("falls back to the defaults for anything invalid", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings({ fontSize: "big", pageFit: "huge", flow: 3, color: "red", zoom: Number.NaN })).toEqual(
      DEFAULT_SETTINGS,
    )
  })

  it("clamps numbers into their range", () => {
    expect(sanitizeSettings({ fontSize: 9999, zoom: 0.01, lineHeight: 50 })).toMatchObject({
      fontSize: 220,
      zoom: 0.5,
      lineHeight: 2.4,
    })
  })
})

describe("readSettings", () => {
  it("reads what was stored on this device and survives damaged storage", () => {
    window.localStorage.setItem("ihsp.library.reader-settings", JSON.stringify({ fontSize: 120 }))
    expect(readSettings().fontSize).toBe(120)

    window.localStorage.setItem("ihsp.library.reader-settings", "{oops")
    expect(readSettings()).toEqual(DEFAULT_SETTINGS)
  })
})

describe("stepZoom", () => {
  it("moves by a quarter and stops at the ends", () => {
    expect(stepZoom(1, 1)).toBe(1.25)
    expect(stepZoom(1, -1)).toBe(0.75)
    expect(stepZoom(3, 1)).toBe(3)
    expect(stepZoom(0.5, -1)).toBe(0.5)
  })
})
