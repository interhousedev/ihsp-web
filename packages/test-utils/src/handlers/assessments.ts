import type {
  AssessmentCreateBody,
  AssessmentItem,
  AssessmentPatchBody,
  AssessmentProposalBody,
  StaffAssessmentItem,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { assessmentIds, assessments, plannerFor, plannerMath, staffAssessments } from "../fixtures/assessments"
import { ids, persons, subjectRefs } from "../fixtures/world"
import { apiUrl, nextId, noContent, notFound, param, query, readJson } from "./utils"

let staffStore: StaffAssessmentItem[] = staffAssessments.map((entry) => ({ ...entry }))
let studentExtra: AssessmentItem[] = []

/** The test server keeps what staff and head students saved; called after every test. */
export function resetAssessments(): void {
  staffStore = staffAssessments.map((entry) => ({ ...entry }))
  studentExtra = []
}

function inRange(entry: AssessmentItem, search: URLSearchParams): boolean {
  const from = search.get("from")
  const to = search.get("to")
  const subject = search.get("subject_id")
  if (from && entry.date < from && (entry.period?.end ?? entry.date) < from) return false
  if (to && entry.date > to && (entry.period?.start ?? entry.date) > to) return false
  return !subject || entry.subject.id === subject
}

function matchesStaff(entry: StaffAssessmentItem, search: URLSearchParams): boolean {
  const wanted = search.get("status")
  if (!inRange(entry, search)) return false
  if (wanted ? entry.status !== wanted : entry.status === "cancelled") return false
  if (!entry.has_date && search.get("undated") !== "true") return false
  const group = search.get("group_id")
  if (group && !entry.audience.some((a) => a.group_id === group)) return false
  const kind = search.get("kind")
  if (kind && entry.kind !== kind) return false
  const source = search.get("source")
  return !source || entry.source === source
}

function subjectOf(subjectId: string | undefined): StaffAssessmentItem["subject"] {
  return Object.values(subjectRefs).find((s) => s.id === subjectId) ?? subjectRefs.math
}

function build(body: Partial<AssessmentCreateBody>, source: "teacher" | "admin"): StaffAssessmentItem {
  return {
    id: nextId(0x11),
    subject: subjectOf(body.subject_id),
    kind: body.kind ?? "midterm",
    title: body.title ?? "",
    date: body.date ?? "2026-10-21",
    starts_at: body.starts_at ?? null,
    lesson_id: body.lesson_id ?? null,
    room: body.room ?? null,
    status: "planned",
    source,
    note: body.note ?? null,
    days_left: 0,
    control: body.control ?? null,
    period: null,
    has_date: true,
    audience: (body.audience ?? []).map((a) => ({
      group_id: a.group_id,
      group_name: a.group_id === ids.group1TN1 ? "1TN1" : "2TN2",
      subgroup: a.subgroup ?? null,
    })),
    created_by: source === "admin" ? persons.admin : persons.rakhimov,
    created_at: "2026-10-07T05:12:00Z",
    updated_at: "2026-10-07T05:12:00Z",
  }
}

function patched(entry: StaffAssessmentItem, body: AssessmentPatchBody): StaffAssessmentItem {
  const { status, subject_id, audience, ...rest } = body
  const edited: StaffAssessmentItem = { ...entry, ...rest }
  if (subject_id) edited.subject = subjectOf(subject_id)
  if (audience)
    edited.audience = audience.map((a) => ({ group_id: a.group_id, group_name: "2TN2", subgroup: a.subgroup ?? null }))
  if (status) edited.status = status
  else if (entry.status === "tentative") edited.status = "planned"
  return edited
}

function staffHandlers(prefix: "/v1/staff/assessments" | "/v1/admin/assessments", role: "teacher" | "admin") {
  return [
    http.get(apiUrl(prefix), ({ request }) =>
      HttpResponse.json({ items: staffStore.filter((entry) => matchesStaff(entry, query(request))) }),
    ),
    http.post(apiUrl(prefix), async ({ request }) => {
      const created = build(await readJson<AssessmentCreateBody>(request), role)
      staffStore = [...staffStore, created]
      return HttpResponse.json(created, { status: 201 })
    }),
    http.patch(apiUrl(`${prefix}/:id`), async ({ params, request }) => {
      const id = param(params, "id")
      const current = staffStore.find((entry) => entry.id === id)
      if (!current) return notFound("Assessment")
      const edited = patched(current, await readJson<AssessmentPatchBody>(request))
      staffStore = staffStore.map((entry) => (entry.id === id ? edited : entry))
      return HttpResponse.json(edited)
    }),
    http.delete(apiUrl(`${prefix}/:id`), ({ params }) => {
      const id = param(params, "id")
      if (!staffStore.some((entry) => entry.id === id)) return notFound("Assessment")
      staffStore = staffStore.map((entry) => (entry.id === id ? { ...entry, status: "cancelled" as const } : entry))
      return noContent()
    }),
  ]
}

export const assessmentsHandlers = [
  http.get(apiUrl("/v1/me/assessments"), ({ request }) => {
    const search = query(request)
    const items = [...assessments, ...studentExtra]
      .filter((entry) => entry.status !== "cancelled" && inRange(entry, search))
      .sort((a, b) => a.date.localeCompare(b.date))
    return HttpResponse.json({ items })
  }),
  http.post(apiUrl("/v1/me/assessments"), async ({ request }) => {
    const body = await readJson<AssessmentProposalBody>(request)
    const created: AssessmentItem = {
      id: nextId(0x12),
      subject: subjectOf(body.subject_id),
      kind: body.kind ?? "midterm",
      title: body.title ?? "",
      date: body.date ?? "2026-10-21",
      starts_at: body.starts_at ?? null,
      lesson_id: null,
      room: body.room ?? null,
      status: "tentative",
      source: "head_student",
      note: body.note ?? null,
      days_left: 0,
      control: body.control ?? null,
      period: null,
      has_date: true,
    }
    studentExtra = [...studentExtra, created]
    return HttpResponse.json(created, { status: 201 })
  }),
  http.get(apiUrl("/v1/me/subjects/:subjectId/planner"), ({ params, request }) => {
    const subjectId = param(params, "subjectId")
    const key = (Object.keys(subjectRefs) as (keyof typeof subjectRefs)[]).find((k) => subjectRefs[k].id === subjectId)
    if (!key) return notFound("Subject")
    const base = subjectId === ids.math ? plannerMath : plannerFor(key, 4)
    const whatIf = query(request)
      .getAll("what_if")
      .map((raw) => {
        const [type, value] = raw.split(":")
        return { type: type as "lesson" | "midterm" | "final", value: Number(value) }
      })
    return HttpResponse.json({
      ...base,
      what_if: whatIf,
      assumptions: whatIf.length ? [...base.assumptions, "what_if" as const] : base.assumptions,
    })
  }),
  ...staffHandlers("/v1/staff/assessments", "teacher"),
  ...staffHandlers("/v1/admin/assessments", "admin"),
]

export { assessmentIds }
