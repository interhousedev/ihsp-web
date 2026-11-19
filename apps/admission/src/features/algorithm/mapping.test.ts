import { describe, expect, test } from "bun:test"
import type { AdmissionPreferenceAnswers } from "@ihsp/api"
import { answersToValues, answerToPayload, resumeIndex } from "./mapping"
import type { StepQuestion } from "../../components/stepper"

/** Answers as stored before lists: `setting` is a plain string. */
type LegacyAnswers = Record<string, string | boolean>
const legacy = (answers: LegacyAnswers) => answers as unknown as AdmissionPreferenceAnswers

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
    expect(answersToValues(legacy({ prestige: false, setting: "city" }))).toEqual({
      prestige: "false",
      setting: ["city"],
    })
  })
  test("resume at first unanswered", () => {
    const qs = [q("experience"), q("setting"), q("prestige")]
    expect(resumeIndex(qs, legacy({ experience: "social", prestige: true }))).toBe(1)
    expect(resumeIndex(qs, legacy({ experience: "social", setting: "city", prestige: false }))).toBe(3)
  })
})

describe("traits", () => {
  test("is a quiz-only answer: no preference payload, but merged into the values", async () => {
    const { mergeValues } = await import("./mapping")
    expect(answerToPayload("traits", ["arts"])).toEqual({})
    expect(mergeValues({ traits: ["arts"] }, {} as never).traits).toEqual(["arts"])
  })
})

describe("list preferences", () => {
  test("setting and region are saved as lists; the any chip is the empty list", () => {
    expect(answerToPayload("setting", ["city", "rural"])).toEqual({ setting: ["city", "rural"] })
    expect(answerToPayload("setting", ["any"])).toEqual({ setting: [] })
    expect(answerToPayload("region", ["uz", "GB"])).toEqual({ region: ["UZ", "GB"] })
    expect(answerToPayload("region", ["any"])).toEqual({ region: [] })
    expect(answerToPayload("region", [])).toEqual({ region: [] })
  })
  test("legacy single values become lists", () => {
    expect(answersToValues({ setting: "city", region: "any" } as never)).toEqual({ setting: ["city"], region: ["any"] })
    expect(answersToValues({ setting: [], region: ["UZ"] })).toEqual({ setting: ["any"], region: ["UZ"] })
  })
  test("distance is no longer a question", async () => {
    const { FIELD_ORDER } = await import("./mapping")
    expect(FIELD_ORDER as readonly string[]).not.toContain("distance")
    expect(FIELD_ORDER).toHaveLength(13)
  })
  test("setting and region are multi-choice with an exclusive any chip", async () => {
    const { buildQuestions } = await import("./questions")
    const questions = buildQuestions((key) => key, { majors: [], regions: ["uz"], regionName: (r) => r })
    for (const id of ["setting", "region"]) {
      const question = questions.find((item) => item.id === id)
      expect(question?.kind).toBe("multi")
      expect(question?.options.find((option) => option.value === "any")?.exclusive).toBe(true)
    }
    expect(questions.find((item) => item.id === "region")?.options.map((o) => o.value)).toEqual(["any", "UZ"])
  })
})
