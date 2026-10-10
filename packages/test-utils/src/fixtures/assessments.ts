import type { AssessmentItem, ControlPeriods, PlannerTarget, StaffAssessmentItem, SubjectPlanner } from "@ihsp/api"
import { ids, persons, subjectRefs, uuid } from "./world"
import type { SubjectKey } from "./world"

/** The control weeks Administration set for the current term (2026-2027 half 1). */
export const controlPeriods: ControlPeriods = {
  midterm_1: { start: "2026-10-12", end: "2026-10-16" },
  midterm_2: { start: "2026-11-16", end: "2026-11-20" },
  final: { start: "2026-12-14", end: "2026-12-18" },
}

/** Whole days from the fixture "today" (2026-10-07) to a date. */
function daysLeft(date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse("2026-10-07T00:00:00Z")) / 86_400_000)
}

type Spec = Partial<AssessmentItem> & Pick<AssessmentItem, "id" | "date" | "kind" | "status">

function item(subject: SubjectKey, spec: Spec): AssessmentItem {
  return {
    subject: subjectRefs[subject],
    title: "",
    starts_at: null,
    lesson_id: null,
    room: null,
    source: "teacher",
    note: null,
    control: null,
    period: null,
    has_date: true,
    ...spec,
    days_left: daysLeft(spec.date),
  }
}

export const assessmentIds = {
  mathMidterm: uuid(17, 1),
  physicsEmis: uuid(17, 2),
  englishWeek: uuid(17, 3),
  mathFinal: uuid(17, 4),
  chemistryPast: uuid(17, 5),
  historyHead: uuid(17, 6),
  informaticsWeek: uuid(17, 7),
} as const

/** What the demo student sees: a planned midterm in 7 days, EMIS and head-student suggestions, a week with no date, a past one. */
export const assessments: AssessmentItem[] = [
  item("chemistry", {
    id: assessmentIds.chemistryPast,
    kind: "midterm",
    status: "planned",
    date: "2026-10-02",
    title: "Reactions",
    control: "midterm_1",
    period: { start: "2026-10-01", end: "2026-10-03" },
  }),
  item("english", {
    id: assessmentIds.englishWeek,
    kind: "midterm",
    status: "planned",
    source: "admin",
    date: "2026-10-12",
    control: "midterm_1",
    period: controlPeriods.midterm_1 ?? null,
    has_date: false,
  }),
  item("informatics", {
    id: assessmentIds.informaticsWeek,
    kind: "midterm",
    status: "planned",
    source: "admin",
    date: "2026-10-12",
    control: "midterm_1",
    period: controlPeriods.midterm_1 ?? null,
    has_date: false,
  }),
  item("math", {
    id: assessmentIds.mathMidterm,
    kind: "midterm",
    status: "planned",
    date: "2026-10-14",
    starts_at: "2026-10-14T04:00:00Z",
    title: "Algebra and functions",
    room: "204",
    note: "Chapters 1–4; bring a calculator.",
    control: "midterm_1",
    period: controlPeriods.midterm_1 ?? null,
  }),
  item("physics", {
    id: assessmentIds.physicsEmis,
    kind: "midterm",
    status: "tentative",
    source: "emis",
    date: "2026-10-21",
    lesson_id: ids.lessonPhysicsToday,
    title: "Mechanics",
  }),
  item("history", {
    id: assessmentIds.historyHead,
    kind: "midterm",
    status: "tentative",
    source: "head_student",
    date: "2026-11-18",
    note: "The head student suggests this date.",
    control: "midterm_2",
    period: controlPeriods.midterm_2 ?? null,
  }),
  item("math", {
    id: assessmentIds.mathFinal,
    kind: "final",
    status: "planned",
    source: "admin",
    date: "2026-12-16",
    starts_at: "2026-12-16T04:00:00Z",
    room: "Klaster",
    control: "final",
    period: controlPeriods.final ?? null,
  }),
]

const audience2TN2 = [{ group_id: ids.group2TN2, group_name: "2TN2", subgroup: null as 1 | 2 | null }]

/** The same controls as staff see them (audience and author). */
export const staffAssessments: StaffAssessmentItem[] = assessments.map((entry) => ({
  ...entry,
  audience: audience2TN2,
  created_by: entry.source === "teacher" ? persons.rakhimov : entry.source === "admin" ? persons.admin : null,
  created_at: entry.has_date ? "2026-09-20T05:00:00Z" : null,
  updated_at: entry.has_date ? "2026-09-20T05:00:00Z" : null,
}))

// --- Mark planner (math: lesson 5, 4, 5 and midterm 4; the final and the second midterm are still to come) ---

function target(grade: 5 | 4 | 3, spec: Partial<PlannerTarget>): PlannerTarget {
  return {
    grade,
    threshold: grade - 0.5,
    status: "needed",
    control: null,
    min_value: null,
    min_both: null,
    pairs: [],
    ...spec,
  }
}

export const plannerMath: SubjectPlanner = {
  subject: subjectRefs.math,
  semester: 4,
  lesson: { count: 3, average: 4.67 },
  midterm: { count: 1, average: 4 },
  final: { count: 0, average: null },
  semester_mark: 4.33,
  components: ["lesson", "midterm"],
  missing: ["final"],
  remaining: { midterm: 1, final: 1 },
  pending: ["midterm", "final"],
  predicted: { value: 4.56, midterm: 5, final: 5 },
  targets: [
    target(5, {
      min_both: 5,
      pairs: [
        { midterm: 5, min_final: 5 },
        { midterm: 4, min_final: null },
        { midterm: 3, min_final: null },
        { midterm: 2, min_final: null },
      ],
    }),
    target(4, {
      status: "secured",
    }),
    target(3, { status: "secured" }),
  ],
  assumptions: ["rounding", "controls_per_semester", "pending_as_lesson_average"],
  what_if: [],
}

/** Planner of any other subject: only lesson marks so far, nothing reachable that needs a plan. */
export function plannerFor(subject: SubjectKey, lessonAverage: number | null): SubjectPlanner {
  return {
    ...plannerMath,
    subject: subjectRefs[subject],
    lesson: { count: lessonAverage === null ? 0 : 2, average: lessonAverage },
    midterm: { count: 0, average: null },
    components: lessonAverage === null ? [] : ["lesson"],
    missing: lessonAverage === null ? ["lesson", "midterm", "final"] : ["midterm", "final"],
    remaining: { midterm: 2, final: 1 },
    semester_mark: lessonAverage,
    predicted: { value: lessonAverage, midterm: null, final: null },
    targets: [5, 4, 3].map((grade) =>
      target(grade as 5 | 4 | 3, { status: lessonAverage === null ? "unknown" : "secured" }),
    ),
    assumptions: lessonAverage === null ? ["rounding", "no_lesson_marks"] : plannerMath.assumptions,
  }
}
