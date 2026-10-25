/**
 * EXAM-2, EXAM-3: the pure helpers behind the admin exams list: filters to request, rows in order, the form to the
 * create and patch bodies, and the CSV export.
 */
import { describe, expect, test } from "bun:test"
import type { StaffAssessmentItem } from "@ihsp/api"
import { assessmentIds, controlPeriods, ids, staffAssessments } from "@ihsp/test-utils"
import { examCsvRows } from "../features/exams/utils/exam-csv"
import { examParams, inControl, selectedControl, sortExams } from "../features/exams/utils/exam-filters"
import {
  emptyExamForm,
  examCreateBody,
  examPatchBody,
  examToForm,
  setDateForm,
  validateExam,
  withControl,
  withKind,
} from "../features/exams/utils/exam-form"
import { examStatus } from "../features/exams/utils/exam-status"

const NO_FILTERS = {
  from: null,
  to: null,
  group_id: null,
  subject_id: null,
  kind: null,
  control: null,
  status: null,
  source: null,
  undated: null,
}

function find(id: string): StaffAssessmentItem {
  const item = staffAssessments.find((entry) => entry.id === id)
  if (!item) throw new Error(`no fixture ${id}`)
  return item
}

describe("exam filters to request parameters", () => {
  test("no filters ask for the default list: no status, no undated", () => {
    expect(examParams(NO_FILTERS)).toEqual({})
  })

  test("each filter becomes its own parameter", () => {
    const params = examParams({
      from: "2026-10-01",
      to: "2026-12-31",
      group_id: ids.group2TN2,
      subject_id: ids.math,
      kind: "final",
      control: null,
      status: "tentative",
      source: "emis",
      undated: "true",
    })

    expect(params).toEqual({
      from: "2026-10-01",
      to: "2026-12-31",
      group_id: ids.group2TN2,
      subject_id: ids.math,
      kind: "final",
      status: "tentative",
      source: "emis",
      undated: true,
    })
  })

  test("a value that is not one of the choices is dropped", () => {
    expect(examParams({ ...NO_FILTERS, kind: "quiz", status: "done", source: "me", undated: "yes" })).toEqual({})
  })

  test("a control week asks for the dates of that week", () => {
    expect(examParams({ ...NO_FILTERS, control: "midterm_2" }, controlPeriods)).toEqual({
      from: "2026-11-16",
      to: "2026-11-20",
    })
  })

  test("a control week and a date range are crossed: the narrower limits win", () => {
    const params = examParams(
      { ...NO_FILTERS, control: "midterm_1", from: "2026-10-14", to: "2026-12-01" },
      controlPeriods,
    )

    expect(params).toEqual({ from: "2026-10-14", to: "2026-10-16" })
  })

  test("a control week that is not set in the term adds no dates", () => {
    expect(examParams({ ...NO_FILTERS, control: "final" }, { midterm_1: controlPeriods.midterm_1 })).toEqual({})
  })

  test("only the three control names are understood", () => {
    expect(selectedControl("midterm_1")).toBe("midterm_1")
    expect(selectedControl("midterm_3")).toBeNull()
    expect(selectedControl(null)).toBeNull()
  })

  test("rows are kept for a control week by their control, not only by their date", () => {
    const math = find(assessmentIds.mathMidterm)
    const physics = find(assessmentIds.physicsEmis)

    expect(inControl(math, "midterm_1")).toBe(true)
    expect(inControl(math, "final")).toBe(false)
    expect(inControl(physics, "midterm_1")).toBe(false)
    expect(inControl(physics, null)).toBe(true)
  })

  test("rows are in date order, then by subject", () => {
    const sorted = sortExams(staffAssessments.toReversed()).map((item) => item.id)

    expect(sorted).toEqual([
      assessmentIds.chemistryPast,
      assessmentIds.englishWeek,
      assessmentIds.informaticsWeek,
      assessmentIds.mathMidterm,
      assessmentIds.physicsEmis,
      assessmentIds.historyHead,
      assessmentIds.mathFinal,
    ])
  })
})

describe("exam status", () => {
  test("a control week without a date is shown as such, whatever its stored status", () => {
    expect(examStatus(find(assessmentIds.englishWeek))).toBe("undated")
    expect(examStatus(find(assessmentIds.physicsEmis))).toBe("tentative")
    expect(examStatus(find(assessmentIds.mathMidterm))).toBe("planned")
    expect(examStatus({ ...find(assessmentIds.mathMidterm), status: "cancelled" })).toBe("cancelled")
  })
})

describe("exam form", () => {
  test("a new form asks for a subject, a group and a date", () => {
    expect(validateExam(emptyExamForm())).toEqual(["subject", "audience", "date"])
  })

  test("a filled form is valid; the time is optional but must be hours and minutes", () => {
    const form = { ...emptyExamForm(), subject_id: ids.math, audience: [{ group_id: ids.group2TN2, subgroup: null }] }

    expect(validateExam({ ...form, date: "2026-10-14" })).toEqual([])
    expect(validateExam({ ...form, date: "2026-10-14", time: "9am" })).toEqual(["time"])
  })

  test("choosing a control week sets the kind it is for", () => {
    const form = { ...emptyExamForm(), kind: "other" as const }

    expect(withControl(form, "final")).toMatchObject({ kind: "final", control: "final" })
    expect(withControl(form, "midterm_2")).toMatchObject({ kind: "midterm", control: "midterm_2" })
    expect(withControl({ ...form, control: "final" }, null)).toMatchObject({ kind: "other", control: null })
  })

  test("changing the kind drops a control week that does not fit it", () => {
    const form = withControl(emptyExamForm(), "midterm_1")

    expect(withKind(form, "midterm").control).toBe("midterm_1")
    expect(withKind(form, "final").control).toBeNull()
    expect(withKind(form, "other").control).toBeNull()
  })

  test("the create body leaves out what was not filled and trims the rest", () => {
    const form = {
      ...emptyExamForm(),
      subject_id: ids.math,
      audience: [{ group_id: ids.group2TN2, subgroup: null }],
      date: "2026-10-14",
      room: "  204 ",
      note: "   ",
    }

    expect(examCreateBody(form)).toEqual({
      subject_id: ids.math,
      audience: [{ group_id: ids.group2TN2, subgroup: null }],
      kind: "midterm",
      date: "2026-10-14",
      room: "204",
    })
  })

  test("the create body turns the Tashkent time into a UTC instant and keeps the control week", () => {
    const form = {
      ...withControl(emptyExamForm(), "final"),
      subject_id: ids.math,
      audience: [{ group_id: ids.group2TN2, subgroup: 1 as const }],
      date: "2026-12-16",
      time: "09:00",
      title: " Final test ",
    }

    expect(examCreateBody(form)).toMatchObject({
      kind: "final",
      control: "final",
      starts_at: "2026-12-16T04:00:00.000Z",
      title: "Final test",
    })
  })

  test("a control week without a date starts a form for that subject, group and week", () => {
    const form = setDateForm(find(assessmentIds.englishWeek))

    expect(form).toMatchObject({
      subject_id: ids.english,
      audience: [{ group_id: ids.group2TN2, subgroup: null }],
      kind: "midterm",
      control: "midterm_1",
      date: null,
    })
    expect(validateExam(form)).toEqual(["date"])
  })

  test("an unchanged form patches nothing", () => {
    const item = find(assessmentIds.mathMidterm)

    expect(examPatchBody(examToForm(item), item)).toEqual({})
  })

  test("the form of a saved exam shows the time in Tashkent", () => {
    expect(examToForm(find(assessmentIds.mathMidterm))).toMatchObject({
      date: "2026-10-14",
      time: "09:00",
      room: "204",
    })
  })

  test("only the changed fields are patched; an emptied one is cleared with null", () => {
    const item = find(assessmentIds.mathMidterm)
    const form = { ...examToForm(item), room: "305", note: "  ", title: "Algebra" }

    expect(examPatchBody(form, item)).toEqual({ title: "Algebra", room: "305", note: null })
  })

  test("a new date alone is patched alone, so the server moves the start time with it", () => {
    const item = find(assessmentIds.mathMidterm)

    expect(examPatchBody({ ...examToForm(item), date: "2026-10-15" }, item)).toEqual({ date: "2026-10-15" })
  })

  test("a new time is patched as an instant on the date; clearing it sends null", () => {
    const item = find(assessmentIds.mathMidterm)

    expect(examPatchBody({ ...examToForm(item), time: "10:30" }, item)).toEqual({
      starts_at: "2026-10-14T05:30:00.000Z",
    })
    expect(examPatchBody({ ...examToForm(item), time: "" }, item)).toEqual({ starts_at: null })
    expect(examPatchBody({ ...examToForm(item), date: "2026-10-15", time: "10:30" }, item)).toEqual({
      date: "2026-10-15",
      starts_at: "2026-10-15T05:30:00.000Z",
    })
  })

  test("kind, control and audience are patched when they change", () => {
    const item = find(assessmentIds.mathMidterm)
    const form = {
      ...withControl(examToForm(item), "midterm_2"),
      audience: [
        { group_id: ids.group2TN2, subgroup: null },
        { group_id: ids.group1TN1, subgroup: null },
      ],
    }

    expect(examPatchBody(form, item)).toEqual({
      control: "midterm_2",
      audience: form.audience,
    })
    expect(examPatchBody(withKind(examToForm(item), "other"), item)).toEqual({ kind: "other", control: null })
  })

  test("the same audience in another order is not a change", () => {
    const item: StaffAssessmentItem = {
      ...find(assessmentIds.mathMidterm),
      audience: [
        { group_id: ids.group2TN2, group_name: "2TN2", subgroup: 1 },
        { group_id: ids.group1TN1, group_name: "1TN1", subgroup: null },
      ],
    }
    const form = { ...examToForm(item), audience: examToForm(item).audience.toReversed() }

    expect(examPatchBody(form, item)).toEqual({})
  })
})

describe("exam CSV", () => {
  const text = {
    header: [
      "Date",
      "Week",
      "Subject",
      "Groups",
      "Kind",
      "Control",
      "Time",
      "Room",
      "Status",
      "Source",
      "Set by",
      "Title",
      "Note",
    ],
    kind: (kind: string) => `kind:${kind}`,
    control: (name: string) => `control:${name}`,
    status: (status: string) => `status:${status}`,
    source: (source: string) => `source:${source}`,
    time: (iso: string) => iso.slice(11, 16),
  }

  test("starts with the header and has a row per exam", () => {
    const rows = examCsvRows(staffAssessments, text)

    expect(rows[0]).toEqual(text.header)
    expect(rows).toHaveLength(staffAssessments.length + 1)
  })

  test("a dated exam has its date and time; a week without a date has the week and no date", () => {
    const rows = examCsvRows([find(assessmentIds.mathMidterm), find(assessmentIds.englishWeek)], text)

    expect(rows[1]).toEqual([
      "2026-10-14",
      "",
      "Mathematics",
      "2TN2",
      "kind:midterm",
      "control:midterm_1",
      "04:00",
      "204",
      "status:planned",
      "source:teacher",
      "Rakhimov Timur",
      "Algebra and functions",
      "Chapters 1–4; bring a calculator.",
    ])
    expect(rows[2]?.slice(0, 3)).toEqual(["", "2026-10-12 – 2026-10-16", "English"])
    expect(rows[2]?.[8]).toBe("status:undated")
  })
})
