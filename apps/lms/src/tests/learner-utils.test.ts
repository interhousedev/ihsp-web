/** The lesson player's pure helpers: Stepik numbering, the step buttons and the course progress. */
import { describe, expect, it } from "bun:test"
import type { CoursePage, OutlineSection, StepView } from "@ihsp/api"
import { coursePage, coursePageNotEnrolled } from "@ihsp/test-utils"
import { blockTargets, firstOpenBlock, resolveBlock } from "../features/player/utils/block-nav"
import { courseProgress, formatPoints } from "../features/shared/utils/course-progress"
import { hrefs } from "../features/shared/utils/hrefs"
import { lessonNumbers } from "../features/shared/utils/outline"

const outline: OutlineSection[] = [
  { id: "m1", title: "One", steps: [{ step_id: "a", title: "A" }] },
  {
    id: "m2",
    title: "Two",
    steps: [
      { step_id: "b", title: "B" },
      { step_id: "c", title: "C" },
    ],
  },
]

type Blocks = StepView["blocks"]
const blocks = (...passed: boolean[]): Blocks =>
  passed.map((done, index) => ({ id: `b${index}`, type: "text", markdown: "", passed: done }))

describe("lesson numbers", () => {
  it("number lessons as module.lesson from one", () => {
    expect([...lessonNumbers(outline)]).toEqual([
      ["a", "1.1"],
      ["b", "2.1"],
      ["c", "2.2"],
    ])
  })
})

describe("which step opens", () => {
  it("is the first step not passed, or the first when all are passed", () => {
    expect(firstOpenBlock(blocks(true, true, false, false))).toBe(2)
    expect(firstOpenBlock(blocks(true, true))).toBe(0)
    expect(firstOpenBlock([])).toBe(0)
  })

  it("takes the 1-based step of the address, kept inside the lesson", () => {
    const three = blocks(true, false, false)
    expect(resolveBlock(2, three, null)).toBe(1)
    expect(resolveBlock(99, three, null)).toBe(2)
    expect(resolveBlock(1, three, 2)).toBe(0)
    expect(resolveBlock(null, three, null)).toBe(1)
    // Passes that arrive while the lesson is open do not move the open step.
    expect(resolveBlock(null, blocks(true, true, false), 1)).toBe(1)
    expect(resolveBlock(null, [], null)).toBe(0)
  })
})

describe("step buttons", () => {
  it("walk the steps inside the lesson", () => {
    expect(blockTargets({ stepId: "b", index: 1, total: 3, outline })).toEqual({
      previous: { kind: "step", stepId: "b", block: 1 },
      next: { kind: "step", stepId: "b", block: 3 },
    })
  })

  it("lead to the neighbour lessons at the ends of the lesson", () => {
    expect(blockTargets({ stepId: "b", index: 0, total: 2, outline }).previous).toEqual({
      kind: "lesson",
      stepId: "a",
      block: 1,
    })
    expect(blockTargets({ stepId: "b", index: 1, total: 2, outline }).next).toEqual({
      kind: "lesson",
      stepId: "c",
      block: null,
    })
  })

  it("have nowhere to go before the first and after the last lesson, or without an outline", () => {
    expect(blockTargets({ stepId: "a", index: 0, total: 1, outline }).previous).toBeNull()
    expect(blockTargets({ stepId: "c", index: 0, total: 1, outline }).next).toBeNull()
    expect(blockTargets({ stepId: "a", index: 0, total: 1, outline: null })).toEqual({ previous: null, next: null })
  })

  it("link lessons without steps", () => {
    expect(blockTargets({ stepId: "b", index: 0, total: 0, outline }).next).toEqual({
      kind: "lesson",
      stepId: "c",
      block: null,
    })
  })
})

describe("course progress", () => {
  it("drives the bar by completed lessons and keeps points beside it", () => {
    const page: CoursePage = { ...coursePage, points_total: 5, points_earned: 0, steps_completed: 2, steps_count: 3 }
    expect(courseProgress(page)).toEqual({
      done: 2,
      total: 3,
      percent: 67,
      points: { earned: 0, total: 5 },
    })
  })

  it("has no points for a course without tests", () => {
    const text: CoursePage = { ...coursePage, points_total: 0, points_earned: 0, steps_completed: 1, steps_count: 4 }
    expect(courseProgress(text)).toEqual({ done: 1, total: 4, percent: 25, points: null })
    expect(courseProgress({ ...text, steps_count: 0, steps_completed: 0 })?.percent).toBe(0)
  })

  it("is empty for someone who is not enrolled", () => {
    expect(courseProgress(coursePageNotEnrolled)).toBeNull()
    expect(courseProgress(null)).toBeNull()
  })

  it("prints points without float noise", () => {
    expect(formatPoints(0.1 + 0.2, "en")).toBe("0.3")
    expect(formatPoints(514, "en")).toBe("514")
    expect(formatPoints(2.5, "en")).toBe("2.5")
  })
})

describe("addresses of the steps", () => {
  it("carry the step number only when given", () => {
    expect(hrefs.step("c", "s", "slug")).toBe("/course/step/?course=c&step=s&slug=slug")
    expect(hrefs.step("c", "s", "slug", 3)).toBe("/course/step/?course=c&step=s&slug=slug&block=3")
    expect(hrefs.preview("c", "s", 2)).toBe("/edit/preview/?id=c&step=s&block=2")
  })
})
