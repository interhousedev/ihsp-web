import { describe, expect, it } from "bun:test"
import { courseFormSchema, slugify } from "../features/admin/utils/slugify"
import { describeAnswer, describeValue, isAnswered, withAnswer } from "../features/player/utils/answers"
import { hrefs } from "../features/shared/utils/hrefs"
import { continueStep, neighbours } from "../features/shared/utils/outline"
import { can, resolvePermissions } from "../features/shared/utils/permissions"
import { formatCountdown } from "../features/shared/utils/time"
import { courseStaff, ids, courseOutline } from "@ihsp/test-utils"

describe("hrefs", () => {
  it("puts ids in the query string and skips empty values", () => {
    expect(hrefs.course("derivatives-101")).toBe("/course/?slug=derivatives-101")
    expect(hrefs.step("c1", "s1")).toBe("/course/step/?course=c1&step=s1")
    expect(hrefs.step("c1", "s1", "slug")).toBe("/course/step/?course=c1&step=s1&slug=slug")
    expect(hrefs.preview("c1")).toBe("/edit/preview/?id=c1")
    expect(hrefs.join()).toBe("/join/")
    expect(hrefs.join("A B")).toBe("/join/?code=A+B")
  })
})

describe("permissions", () => {
  it("gives LMS admins everything and others their staff row", () => {
    expect(resolvePermissions(courseStaff, { id: "x", roles: ["lms_admin"] })).toHaveLength(5)
    const author = resolvePermissions(courseStaff, { id: ids.teacherRakhimov, roles: ["teacher"] })
    expect(can(author, "publish")).toBe(true)
    const tester = resolvePermissions(courseStaff, { id: ids.admin, roles: ["teacher"] })
    expect(tester).toEqual(["view_drafts"])
    expect(resolvePermissions(courseStaff, { id: "stranger", roles: ["student"] })).toEqual([])
  })
})

describe("outline helpers", () => {
  it("continues at the first step that is not completed", () => {
    expect(continueStep(courseOutline)?.step_id).toBe(ids.courseStepTest)
  })

  it("finds the previous and next step across sections", () => {
    const { previous, next, position, total } = neighbours(courseOutline, ids.courseStepTest)
    expect(previous?.step_id).toBe(ids.courseStepText)
    expect(next?.step_id).toBe(ids.courseStepCards)
    expect([position, total]).toEqual([2, 3])
  })
})

describe("answers", () => {
  it("drops empty answers", () => {
    expect(isAnswered({ option_ids: [] })).toBe(false)
    expect(isAnswered({ text: "  " })).toBe(false)
    expect(isAnswered({ number: 0 })).toBe(true)
    expect(withAnswer({ q1: { text: "a" } }, "q1", { text: "" })).toEqual({})
    expect(withAnswer({}, "q2", { number: 3 })).toEqual({ q2: { number: 3 } })
  })

  it("describes values with option texts", () => {
    const question = {
      id: "q",
      type: "multiple",
      prompt: "",
      points: 1,
      options: [
        { id: "o1", text: "Two" },
        { id: "o2", text: "Four" },
      ],
    }
    expect(describeValue(question, ["o1", "o2"])).toBe("Two, Four")
    expect(describeAnswer(question, { option_ids: ["o2"] })).toBe("Four")
    expect(describeValue(undefined, 12)).toBe("12")
  })
})

describe("slugify and the course form", () => {
  it("makes Latin addresses from Latin and Cyrillic titles", () => {
    expect(slugify("Derivatives 101!")).toBe("derivatives-101")
    expect(slugify("Производные: основы")).toBe("proizvodnye-osnovy")
    expect(slugify("  --  ")).toBe("")
  })

  it("accepts the backend slug pattern only", () => {
    expect(courseFormSchema.safeParse({ title: "T", slug: "ab", visibility: "public" }).success).toBe(false)
    expect(courseFormSchema.safeParse({ title: "T", slug: "a-b-c", visibility: "invite" }).success).toBe(true)
    expect(courseFormSchema.safeParse({ title: "T", slug: "Has Space", visibility: "public" }).success).toBe(false)
  })
})

describe("formatCountdown", () => {
  it("formats minutes and hours", () => {
    expect(formatCountdown(65)).toBe("1:05")
    expect(formatCountdown(3725)).toBe("1:02:05")
    expect(formatCountdown(-3)).toBe("0:00")
  })
})
