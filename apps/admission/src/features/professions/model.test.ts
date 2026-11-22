import { describe, expect, it } from "bun:test"
import type { Profession } from "./api"
import { addPick, exposurePct, filledCount, isPoorMatch, MAX_PICKS, removePick } from "./model"

const named = (name: string) => ({ id: name, name }) as Profession

describe("professions model", () => {
  it("caps picks and ignores duplicates", () => {
    let ids: string[] = []
    for (const id of ["1", "2", "3", "4", "5", "6"]) ids = addPick(ids, id)
    expect(ids).toHaveLength(MAX_PICKS)
    expect(addPick(ids, "1")).toEqual(ids)
    expect(removePick(ids, "2")).toEqual(["1", "3", "4", "5"])
  })
  it("rounds and clamps exposure", () => {
    expect(exposurePct(0.456)).toBe(46)
    expect(exposurePct(2)).toBe(100)
  })
  it("counts filled circles", () => {
    expect(filledCount({ love: ["a"], good_at: [], needs: ["b"], paid: [] })).toBe(2)
  })
  it("offers a custom title when no name matches", () => {
    expect(isPoorMatch([], "solution architect")).toBe(true)
    expect(isPoorMatch([named("Software developer")], "solution architect")).toBe(true)
    expect(isPoorMatch([named("Solution Architect")], "solution")).toBe(false)
    expect(isPoorMatch([], "a")).toBe(false)
  })
})
