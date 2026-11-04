import { describe, expect, test } from "bun:test"
import type { CurriculumView } from "@ihsp/api"
import { semesterSections } from "./semester-sections"

const curriculum = {
  current_semester: 2,
  semesters: [
    {
      number: 1,
      is_current: false,
      starts_on: null,
      ends_on: null,
      subjects: [{ subject_id: "a", name: { en: "Algebra", ru: "Алгебра", uz: "Algebra" }, class_hours: 60 }],
    },
    {
      number: 2,
      is_current: true,
      starts_on: null,
      ends_on: null,
      subjects: [{ subject_id: "b", name: { en: "Physics", ru: "Физика", uz: "Fizika" }, class_hours: 90 }],
    },
  ],
} as unknown as CurriculumView

describe("semester accordions", () => {
  test("the current semester is open by default and the others are closed", () => {
    const sections = semesterSections(curriculum, 2)
    expect(sections.map((section) => [section.number, section.open])).toEqual([
      [1, false],
      [2, true],
    ])
  })

  test("each semester lists only its own subjects", () => {
    const [first, second] = semesterSections(curriculum, 2)
    expect(first?.subjects.map((subject) => subject.subjectId)).toEqual(["a"])
    expect(second?.subjects.map((subject) => subject.subjectId)).toEqual(["b"])
  })

  test("without a curriculum or a current semester there is nothing to show", () => {
    expect(semesterSections(null, null)).toEqual([])
  })
})
