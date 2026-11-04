import { describe, expect, it } from "bun:test"
import type { Importance } from "@ihsp/api"
import { renderLibrary } from "../test-support"
import { ImportanceBadge } from "./importance-badge"

describe("ImportanceBadge", () => {
  const TONES: [Importance, string][] = [
    ["essential", "destructive"],
    ["recommended", "warning"],
    ["further", "neutral"],
  ]

  for (const [importance, tone] of TONES) {
    it(`shows ${importance} on the ${tone} status tone, not a hand-picked colour`, () => {
      renderLibrary(<ImportanceBadge importance={importance} />)

      const badge = document.querySelector("[data-tone]")
      expect(badge).toHaveAttribute("data-tone", tone)
      expect(badge?.className).not.toMatch(/amber|rose/)
    })
  }
})
