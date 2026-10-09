/** ACA-14, ACA-15: countdown, period and list helpers of the exams pages and the mark planner. */
import { describe, expect, test } from "bun:test"
import { assessmentIds, assessments, flashcardSets, ids, subjectRefs } from "@ihsp/test-utils"
import type { AssessmentItem, SubjectDetail } from "@ihsp/api"
import { formatDate } from "@ihsp/i18n"
import { countdownOf } from "../features/exams/utils/countdown"
import { decksForSubject } from "../features/exams/utils/matching-decks"
import { controlKeyOf } from "../features/exams/utils/control-key"
import { filterBySubject, findExam, groupByMonth, splitExams, subjectsOf } from "../features/exams/utils/exam-list"
import { newDeckHref, examHref } from "../features/exams/utils/hrefs"
import { materialsSince } from "../features/exams/utils/materials-since"
import { nextControls } from "../features/exams/utils/next-controls"
import { formatPeriod } from "../features/exams/utils/period"
import { previousControl } from "../features/exams/utils/previous-control"
import { startsAtOf } from "../features/exams/utils/starts-at"
import { formatWhatIf, MAX_WHAT_IF, WHAT_IF_MARKS } from "../features/grades/planner/utils/what-if"

const day = (iso: string, options: Intl.DateTimeFormatOptions) => formatDate(iso, "en", options)

function exam(overrides: Partial<AssessmentItem> & Pick<AssessmentItem, "id" | "date">): AssessmentItem {
  const base = assessments[0] as AssessmentItem
  return { ...base, status: "planned", has_date: true, starts_at: null, ...overrides }
}

describe("countdown", () => {
  test("today, tomorrow and yesterday have their own words", () => {
    expect(countdownOf(0)).toEqual({ kind: "today" })
    expect(countdownOf(1)).toEqual({ kind: "tomorrow" })
    expect(countdownOf(-1)).toEqual({ kind: "yesterday" })
  })

  test("other days count the days ahead or behind", () => {
    expect(countdownOf(7)).toEqual({ kind: "in", days: 7 })
    expect(countdownOf(-3)).toEqual({ kind: "ago", days: 3 })
  })
})

describe("control period", () => {
  test("a week inside one month collapses to 12–17 Oct", () => {
    expect(formatPeriod({ start: "2026-10-12", end: "2026-10-17" }, day)).toBe("12–17 Oct")
  })

  test("a week across two months names both months", () => {
    expect(formatPeriod({ start: "2026-10-28", end: "2026-11-02" }, day)).toBe("28 Oct – 2 Nov")
  })

  test("a one-day period is a single date", () => {
    expect(formatPeriod({ start: "2026-10-02", end: "2026-10-02" }, day)).toBe("2 Oct")
  })
})

describe("exam list", () => {
  test("past controls are split from upcoming ones; upcoming go soonest first, past most recent first", () => {
    const { upcoming, past } = splitExams(assessments)

    expect(past.map((item) => item.id)).toEqual([assessmentIds.chemistryPast])
    expect(upcoming.map((item) => item.date)).toEqual(upcoming.map((item) => item.date).toSorted())
    expect(upcoming[0]?.date).toBe("2026-10-12")
    expect(upcoming.at(-1)?.id).toBe(assessmentIds.mathFinal)
  })

  test("on the same day a dated control comes before a week without a date", () => {
    const week = exam({ id: "w", date: "2026-10-12", has_date: false, days_left: 5 })
    const dated = exam({ id: "d", date: "2026-10-12", days_left: 5 })

    expect(splitExams([week, dated]).upcoming.map((item) => item.id)).toEqual(["d", "w"])
  })

  test("controls are grouped by month in the order they came", () => {
    const { upcoming } = splitExams(assessments)

    expect(groupByMonth(upcoming).map((group) => [group.month, group.items.length])).toEqual([
      ["2026-10", 4],
      ["2026-11", 1],
      ["2026-12", 1],
    ])
  })

  test("subjects are listed once, by name, and the filter keeps one of them", () => {
    expect(subjectsOf(assessments).map((subject) => subject.name)).toEqual([
      "Chemistry",
      "English",
      "History",
      "Informatics",
      "Mathematics",
      "Physics",
    ])
    expect(filterBySubject(assessments, ids.math)).toHaveLength(2)
    expect(filterBySubject(assessments, null)).toHaveLength(assessments.length)
  })

  test("a control is found by id", () => {
    expect(findExam(assessments, assessmentIds.mathMidterm)?.subject.name).toBe("Mathematics")
    expect(findExam(assessments, "nope")).toBeNull()
    expect(findExam(assessments, null)).toBeNull()
  })

  test("the control name comes from the control week, then the kind", () => {
    expect(controlKeyOf(exam({ id: "a", date: "2026-10-12", control: "midterm_1" }))).toBe("midterm1")
    expect(controlKeyOf(exam({ id: "a", date: "2026-10-12", control: "midterm_2" }))).toBe("midterm2")
    expect(controlKeyOf(exam({ id: "a", date: "2026-10-12", control: "final" }))).toBe("final")
    expect(controlKeyOf(exam({ id: "a", date: "2026-10-12", control: null, kind: "midterm" }))).toBe("midterm")
    expect(controlKeyOf(exam({ id: "a", date: "2026-10-12", control: null, kind: "final" }))).toBe("final")
    expect(controlKeyOf(exam({ id: "a", date: "2026-10-12", control: null, kind: "other" }))).toBe("other")
  })

  test("links use the trailing-slash style", () => {
    expect(examHref("abc")).toBe("/exams/view/?id=abc")
    expect(newDeckHref("Math — exam")).toBe("/flashcards/edit/?title=Math+%E2%80%94+exam")
  })
})

describe("previous control", () => {
  const midterm1 = exam({ id: "m1", date: "2026-10-14", control: "midterm_1", subject: subjectRefs.math })
  const midterm2 = exam({ id: "m2", date: "2026-11-18", control: "midterm_2", subject: subjectRefs.math })
  const final = exam({ id: "f", date: "2026-12-16", control: "final", kind: "final", subject: subjectRefs.math })
  const otherSubject = exam({ id: "p", date: "2026-11-10", control: "midterm_1", subject: subjectRefs.physics })

  test("is the latest earlier control of the same subject", () => {
    expect(previousControl([midterm1, midterm2, final, otherSubject], final)?.id).toBe("m2")
    expect(previousControl([midterm1, midterm2, final, otherSubject], midterm2)?.id).toBe("m1")
  })

  test("the first control of the semester has none, even if the last final was a few months ago", () => {
    const lastFinal = exam({
      id: "old",
      date: "2026-06-10",
      control: "final",
      kind: "final",
      subject: subjectRefs.math,
    })

    expect(previousControl([lastFinal, midterm1], midterm1)).toBeNull()
  })

  test("a week without a date is not a previous control", () => {
    const week = exam({ id: "w", date: "2026-10-12", has_date: false, subject: subjectRefs.math, control: null })

    expect(previousControl([week, midterm2], midterm2)).toBeNull()
  })
})

describe("materials since the previous control", () => {
  const lesson = (
    id: string,
    date: string,
    topic: string | null = null,
    topicSource: "emis" | "manual" | null = null,
  ) => ({ id, date, topic, topic_source: topicSource }) as SubjectDetail["lessons"][number]
  const material = (linkId: string, lessonId: string, extra: Partial<SubjectDetail["materials"][number]> = {}) =>
    ({
      link_id: linkId,
      lesson_id: lessonId,
      role: "material",
      kind: "url",
      short_url: `http://s/${linkId}`,
      title: linkId,
      hidden: false,
      source: "user",
      created_at: "2026-10-01T00:00:00Z",
      ...extra,
    }) as SubjectDetail["materials"][number]
  const detail = {
    lessons: [
      lesson("old", "2026-10-01"),
      lesson("a", "2026-10-05"),
      lesson("b", "2026-10-06"),
      lesson("future", "2026-10-09"),
    ],
    materials: [
      material("m-old", "old"),
      material("m-a", "a"),
      material("m-b", "b"),
      material("m-hidden", "b", { hidden: true }),
      material("m-emis", "b", { source: "emis" }),
      material("m-future", "future"),
      material("m-lost", "unknown-lesson"),
    ],
  } as unknown as SubjectDetail
  const previous = exam({ id: "prev", date: "2026-10-02" })

  test("lists visible IHSP materials of lessons after the previous control up to today, newest lesson first", () => {
    const result = materialsSince(detail, previous, "2026-10-07")

    expect(result.map((entry) => entry.material.link_id)).toEqual(["m-b", "m-a"])
  })

  test("without a previous control there is no lower bound", () => {
    const result = materialsSince(detail, null, "2026-10-07")

    expect(result.map((entry) => entry.material.link_id)).toEqual(["m-b", "m-a", "m-old"])
  })

  test("a lesson on the day of the previous control is not after it", () => {
    const result = materialsSince(detail, exam({ id: "p", date: "2026-10-05" }), "2026-10-07")

    expect(result.map((entry) => entry.material.link_id)).toEqual(["m-b"])
  })
})

describe("decks of a subject", () => {
  const deck = (title: string) => ({ ...(flashcardSets[0] as (typeof flashcardSets)[number]), id: title, title })

  test("a deck is matched by the subject name or short name in its title, ignoring case", () => {
    const decks = [deck("Physics: kinematics"), deck("my MATH notes"), deck("Quiz with it"), deck("Biology")]

    expect(decksForSubject(decks, subjectRefs.physics).map((item) => item.title)).toEqual(["Physics: kinematics"])
    expect(decksForSubject(decks, subjectRefs.math).map((item) => item.title)).toEqual(["my MATH notes"])
  })

  test("a short name counts only as a whole word, so IT does not match every title with 'it'", () => {
    const decks = [deck("IT: networks"), deck("Quiz with it"), deck("Informatics basics")]

    expect(decksForSubject(decks, subjectRefs.informatics).map((item) => item.title)).toEqual([
      "IT: networks",
      "Informatics basics",
    ])
  })
})

describe("controls on the Today card", () => {
  test("dated controls come first by date, weeks without a date after them; past and cancelled ones are left out", () => {
    const items = [
      exam({ id: "week", date: "2026-10-12", has_date: false, days_left: 5 }),
      exam({ id: "late", date: "2026-10-21", days_left: 14 }),
      exam({ id: "soon", date: "2026-10-14", days_left: 7 }),
      exam({ id: "gone", date: "2026-10-09", days_left: 2, status: "cancelled" }),
      exam({ id: "past", date: "2026-10-02", days_left: -5 }),
    ]

    expect(nextControls(items).map((item) => item.id)).toEqual(["soon", "late", "week"])
  })
})

describe("start time of a suggestion", () => {
  test("a date and a time in Tashkent become an instant with the +05:00 offset", () => {
    expect(startsAtOf("2026-10-14", "09:00")).toBe("2026-10-14T09:00:00+05:00")
  })

  test("no time means no start time", () => {
    expect(startsAtOf("2026-10-14", "")).toBeNull()
  })
})

describe("what-if marks", () => {
  test("are sent as type:value, in the order they were added", () => {
    expect(
      formatWhatIf([
        { type: "midterm", value: 4 },
        { type: "lesson", value: 5 },
      ]),
    ).toEqual(["midterm:4", "lesson:5"])
  })

  test("marks run from 2 to 5 and at most 20 can be tried", () => {
    expect(WHAT_IF_MARKS).toEqual([5, 4, 3, 2])
    expect(MAX_WHAT_IF).toBe(20)
  })
})
