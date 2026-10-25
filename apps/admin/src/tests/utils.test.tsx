/** Pure helpers of the admin app: CSV, term validation, broadcast text and time, audience choices, names. */
import { describe, expect, test } from "bun:test"
import type { Bell } from "@ihsp/api"
import { currentTerm, previousTerm } from "@ihsp/test-utils"
import { toCsv } from "../features/shared/utils/csv"
import { audienceLabel, fullName, fullNameWithMiddle } from "../features/shared/utils/names"
import { toggleAudience } from "../features/shared/components/audience-picker"
import { isoToTashkentLocal, tashkentLocalToIso, wrapSelection } from "../features/broadcasts/utils/broadcast-form"
import { renderTelegramHtml, safeHref } from "../features/broadcasts/utils/telegram-html"
import { emptyTermForm, termInput, termToForm, validateTerm } from "../features/terms/utils/term-form"
import { entryInput, isWholeGroupOnly, newEntryForm } from "../features/timetable/utils/entry-form"
import { lessonPatch } from "../features/lessons/components/lesson-change-dialog"
import { adminLessons } from "@ihsp/test-utils"

describe("toCsv (ADM-16)", () => {
  test("quotes commas, quotes and line breaks", () => {
    expect(
      toCsv([
        ["name", "note"],
        ["A, B", 'say "hi"'],
        ["line\nbreak", null],
      ]),
    ).toBe('name,note\r\n"A, B","say ""hi"""\r\n"line\nbreak",')
  })

  test("text that starts like a formula is kept as text", () => {
    expect(toCsv([["=SUM(A1)", "+1 call", "@user", "-note"]])).toBe("'=SUM(A1),'+1 call,'@user,'-note")
  })

  test("plain numbers, including negative ones, stay numbers", () => {
    expect(toCsv([[5, "-3", 0.5, true]])).toBe("5,-3,0.5,true")
  })
})

describe("term form (ACA-4, ADM-18)", () => {
  test("a term loaded from the API is valid", () => {
    expect(validateTerm(termToForm(currentTerm))).toEqual([])
  })

  test("an empty form lists the missing parts", () => {
    expect(validateTerm(emptyTermForm())).toEqual(["year", "dates", "noBells"])
  })

  test("the end date must come after the start date", () => {
    expect(validateTerm({ ...termToForm(currentTerm), ends_on: "2026-09-01" })).toEqual(["order"])
  })

  test("a bell must start before it ends and have a weekday", () => {
    const form = termToForm(currentTerm)
    const bells: Bell[] = [{ period: 1, start: "10:00", end: "09:00", weekdays: [], source: "manual" }]
    expect(validateTerm({ ...form, bells })).toEqual(["bellTime", "bellWeekdays"])
  })

  test("the same period on the same weekday twice is a duplicate; Friday can differ", () => {
    const form = termToForm(currentTerm)
    const dup: Bell[] = [
      { period: 1, start: "08:30", end: "09:15", weekdays: [1, 2], source: "manual" },
      { period: 1, start: "08:30", end: "09:00", weekdays: [2], source: "manual" },
    ]
    expect(validateTerm({ ...form, bells: dup })).toEqual(["bellDuplicate"])
    const friday: Bell[] = [
      { period: 1, start: "08:30", end: "09:15", weekdays: [1, 2, 3, 4], source: "manual" },
      { period: 1, start: "08:30", end: "09:00", weekdays: [5], source: "manual" },
    ]
    expect(validateTerm({ ...form, bells: friday })).toEqual([])
  })

  test("a stored term that still lists Saturday opens without it, and a Saturday-only bell is left out", () => {
    const legacy: Bell[] = [
      { period: 1, start: "08:30", end: "09:15", weekdays: [1, 2, 3, 4, 5, 6], source: "manual" },
      { period: 2, start: "09:25", end: "10:10", weekdays: [6], source: "manual" },
    ]
    const term = { ...currentTerm, bells: legacy }
    expect(termToForm(term).bells).toEqual([{ ...legacy[0], weekdays: [1, 2, 3, 4, 5] }])
    expect(emptyTermForm(term).bells.map((bell) => bell.weekdays)).toEqual([[1, 2, 3, 4, 5]])
    expect(validateTerm(termToForm(term))).toEqual([])
  })

  test("the request body keeps who set each bell, so the EMIS sync can tell its own bells", () => {
    const form = termToForm(previousTerm)
    expect(termInput(form).bells.map((bell) => bell.source)).toEqual(Array(form.bells.length).fill("emis"))
    expect(termInput(termToForm(currentTerm)).bells.every((bell) => bell.source === "manual")).toBe(true)
  })

  test("a new term copies the times of the template as bells set by hand, even when they came from EMIS", () => {
    const form = emptyTermForm(previousTerm)
    expect(form.bells.map((bell) => bell.start)).toEqual(previousTerm.bells.map((bell) => bell.start))
    expect(form.bells.every((bell) => bell.source === "manual")).toBe(true)
  })

  test("the request body is sorted and free of duplicate days", () => {
    const form = { ...termToForm(currentTerm), non_study_days: ["2026-11-04", "2026-10-01", "2026-11-04"] }
    expect(termInput(form).non_study_days).toEqual(["2026-10-01", "2026-11-04"])
  })
})

describe("broadcast helpers", () => {
  test("Tashkent time (UTC+5) converts to UTC and back", () => {
    expect(tashkentLocalToIso("2026-10-09T10:00")).toBe("2026-10-09T05:00:00.000Z")
    expect(isoToTashkentLocal("2026-10-09T05:00:00Z")).toBe("2026-10-09T10:00")
    expect(tashkentLocalToIso("not a time")).toBeNull()
  })

  test("a time just after midnight in Tashkent falls on the previous UTC day", () => {
    expect(tashkentLocalToIso("2026-10-09T02:30")).toBe("2026-10-08T21:30:00.000Z")
  })

  test("wrapSelection surrounds the selection or a placeholder", () => {
    expect(wrapSelection("Hello world", 0, 5, "<b>", "</b>", "x")).toEqual({
      text: "<b>Hello</b> world",
      selectionStart: 3,
      selectionEnd: 8,
    })
    expect(wrapSelection("Hi ", 3, 3, "<i>", "</i>", "text").text).toBe("Hi <i>text</i>")
  })

  test("only web and Telegram links survive in the preview", () => {
    expect(safeHref('href="https://ihsu.uz/a?b=1&amp;c=2"')).toBe("https://ihsu.uz/a?b=1&c=2")
    expect(safeHref('href="javascript:alert(1)"')).toBeNull()
    expect(safeHref('href="data:text/html,x"')).toBeNull()
  })

  test("unknown tags and attributes are shown as text and unclosed tags are closed", () => {
    const nodes = renderTelegramHtml("<b>bold <img src=x onerror=alert(1)> <i>open")
    expect(nodes).toHaveLength(1)
  })
})

describe("audience choices (ACA-5)", () => {
  const group = "g1"

  test("the whole group excludes its subgroups and the other way round", () => {
    const sub1 = toggleAudience([], group, 1, true)
    expect(sub1).toEqual([{ group_id: group, subgroup: 1 }])
    expect(toggleAudience(sub1, group, null, true)).toEqual([{ group_id: group, subgroup: null }])
    expect(toggleAudience([{ group_id: group, subgroup: null }], group, 2, true)).toEqual([
      { group_id: group, subgroup: 2 },
    ])
  })

  test("both subgroups can be chosen together, other groups are kept", () => {
    const value = toggleAudience(toggleAudience([{ group_id: "g2", subgroup: null }], group, 1, true), group, 2, true)
    expect(value).toHaveLength(3)
    expect(toggleAudience(value, group, 1, false)).toHaveLength(2)
  })
})

describe("timetable entry form", () => {
  const base = newEntryForm({ weekday: 2, period: 3, valid_from: "2026-09-02" })

  test("is not sendable until it has a subject and an audience", () => {
    expect(entryInput("t1", base)).toBeNull()
    expect(entryInput("t1", { ...base, subject_id: "s1" })).toBeNull()
  })

  test("builds the request with an empty room and teacher as null", () => {
    const body = entryInput("t1", {
      ...base,
      subject_id: "s1",
      audience: [{ group_id: "g1", subgroup: null }],
      room_name: "  ",
    })
    expect(body).toMatchObject({
      term_id: "t1",
      weekday: 2,
      period: 3,
      teacher_id: null,
      room_name: null,
      valid_to: null,
    })
  })

  test("an end date before the start date is not sendable", () => {
    expect(
      entryInput("t1", {
        ...base,
        subject_id: "s1",
        audience: [{ group_id: "g1", subgroup: null }],
        valid_to: "2026-08-01",
      }),
    ).toBeNull()
  })

  test("recognises a single whole group", () => {
    expect(isWholeGroupOnly([{ group_id: "g1", subgroup: null }])).toBe(true)
    expect(isWholeGroupOnly([{ group_id: "g1", subgroup: 1 }])).toBe(false)
  })
})

describe("lesson changes (ACA-7)", () => {
  const lesson = adminLessons[0]

  test("only the changed fields go to the API", () => {
    if (!lesson) throw new Error("fixture lesson missing")
    const form = {
      status: "cancelled" as const,
      subject_id: lesson.subject.id,
      teacher_id: lesson.teacher?.id ?? "",
      room_name: lesson.room?.name ?? "",
      date: lesson.date,
      period: lesson.period,
      topic: lesson.topic ?? "",
    }
    expect(lessonPatch(lesson, form)).toEqual({ status: "cancelled" })
    expect(lessonPatch(lesson, { ...form, status: lesson.status, teacher_id: "", room_name: "" })).toEqual({
      teacher_id: null,
      room_name: null,
    })
  })
})

describe("names", () => {
  test("last name first, middle name optional", () => {
    expect(fullName({ first_name: "Aleksey", last_name: "Brastilov" })).toBe("Brastilov Aleksey")
    expect(fullNameWithMiddle({ first_name: "Aleksey", last_name: "Brastilov", middle_name: "Olegovich" })).toBe(
      "Brastilov Aleksey Olegovich",
    )
    expect(fullName(null)).toBe("")
  })

  test("audiences list subgroups after the group", () => {
    expect(
      audienceLabel([
        { group_name: "2TN2", subgroup: 1 },
        { group_name: "2TN3", subgroup: null },
      ]),
    ).toBe("2TN2 · 1, 2TN3")
  })
})
