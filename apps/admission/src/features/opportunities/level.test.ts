import { describe, expect, test as it } from "bun:test"
import type { Opportunity } from "./api"
import { bySchoolLevel, isGraduateLevel } from "./level"

const make = (title: string, grades: number[] = []) =>
  ({ id: title, fields: { title, grades } }) as unknown as Opportunity

describe("school level first", () => {
  const items = [
    make("PhD fellowship in physics"),
    make("Olympiad", [10, 11]),
    make("Master's scholarship"),
    make("Summer camp"),
  ]

  it("detects graduate entries only without grades", () => {
    expect(isGraduateLevel(items[0]!)).toBe(true)
    expect(isGraduateLevel(make("Master class", [9]))).toBe(false)
    expect(isGraduateLevel(items[3]!)).toBe(false)
  })

  it("hides graduate entries from a student", () => {
    expect(bySchoolLevel(items, 10).map((i) => i.id)).toEqual(["Olympiad", "Summer camp"])
  })

  it("moves graduate entries to the end for staff", () => {
    expect(bySchoolLevel(items, null).map((i) => i.id)).toEqual([
      "Olympiad",
      "Summer camp",
      "PhD fellowship in physics",
      "Master's scholarship",
    ])
  })
})
