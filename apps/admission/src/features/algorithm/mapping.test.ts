import { describe, expect, test } from "bun:test"
import { answersToValues, answerToPayload, resumeIndex } from "./mapping"
import type { StepQuestion } from "../../components/stepper"

const q = (id: string): StepQuestion => ({
  id,
  section: "s",
  sectionLabel: "S",
  title: id,
  kind: "single",
  options: [],
})

describe("answer mapping", () => {
  test("booleans become real booleans", () => {
    expect(answerToPayload("prestige", "true")).toEqual({ prestige: true })
    expect(answerToPayload("need_aid", "false")).toEqual({ need_aid: false })
  })
  test("strings pass through, empties are dropped", () => {
    expect(answerToPayload("budget", "under_30k")).toEqual({ budget: "under_30k" })
    expect(answerToPayload("budget", "")).toEqual({})
    expect(answerToPayload("budget", undefined)).toEqual({})
  })
  test("a skipped region is saved as null", () => {
    expect(answerToPayload("region", undefined)).toEqual({ region: null })
  })
  test("stored answers round-trip to stepper values", () => {
    expect(answersToValues({ prestige: false, setting: "city" })).toEqual({ prestige: "false", setting: "city" })
  })
  test("resume at first unanswered", () => {
    const qs = [q("experience"), q("setting"), q("prestige")]
    expect(resumeIndex(qs, { experience: "social", prestige: true })).toBe(1)
    expect(resumeIndex(qs, { experience: "social", setting: "city", prestige: false })).toBe(3)
  })
})
