import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { MOTION, REDUCED_MOTION, motionClass } from "../lib/motion"

describe("motion", () => {
  it("every motion preset carries the reduced-motion override", () => {
    for (const cls of Object.values(MOTION)) {
      expect(cls).toContain("motion-reduce:animate-none")
      expect(cls).toContain("motion-reduce:transition-none")
    }
    expect(MOTION.popup).toContain("duration-150")
    expect(MOTION.slide).toContain("duration-200")
  })

  it("drops animation classes when reduced motion is preferred", () => {
    expect(motionClass("animate-in fade-in-0", true)).toBe("")
    expect(motionClass("animate-in fade-in-0", false)).toBe("animate-in fade-in-0")
    expect(REDUCED_MOTION).toBeTruthy()
  })

  it("overlay components use the shared presets", () => {
    for (const f of ["dialog", "sheet", "popover", "dropdown-menu", "collapsible", "accordion"]) {
      const src = readFileSync(join(import.meta.dir, `../components/ui/${f}.tsx`), "utf8")
      expect(src).toContain("MOTION.")
    }
  })
})
