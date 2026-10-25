import { describe, expect, it } from "bun:test"
import type { ArtifactOptions } from "@ihsp/api"
import { CANVAS_SIZES, THEMES, orientationOf, styleOf } from "./infographic-theme"

describe("infographic theme", () => {
  it("has the three fixed canvas sizes", () => {
    expect(CANVAS_SIZES).toEqual({
      portrait: { width: 800, height: 1200 },
      landscape: { width: 1200, height: 800 },
      square: { width: 1000, height: 1000 },
    })
  })

  it("reads the orientation and the style from the options, with defaults", () => {
    expect(orientationOf({ orientation: "landscape" })).toBe("landscape")
    expect(orientationOf({ format: "conspect" } as ArtifactOptions)).toBe("portrait")
    expect(orientationOf(undefined)).toBe("portrait")
    expect(orientationOf({ orientation: "wide" } as unknown as ArtifactOptions)).toBe("portrait")
    expect(styleOf({ style: "playful" })).toBe("playful")
    expect(styleOf({})).toBe("clean")
  })

  it("defines every variable in all five themes", () => {
    const names = Object.keys(THEMES.clean.vars).toSorted()
    expect(Object.keys(THEMES).toSorted()).toEqual(["bento", "clean", "playful", "scientific", "sketch"])
    for (const theme of Object.values(THEMES)) {
      expect(Object.keys(theme.vars).toSorted()).toEqual(names)
    }
  })
})
