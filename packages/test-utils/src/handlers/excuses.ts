import type {
  Excuse,
  ExcuseDecisionBody,
  ExcuseEndBody,
  ExcuseExclusionBody,
  ExcuseMessageBody,
  ExcuseRequestBody,
  ExcuseStatus,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { excuseTemplates, seedExcuses } from "../fixtures/excuses"
import { FIXTURE_NOW, FIXTURE_TODAY, ids } from "../fixtures/world"
import { apiUrl, nextId, notFound, paginate, param, problem, query, readJson } from "./utils"

let excuses: Excuse[] = seedExcuses()

/** Back to the seeded state; `preload.ts` calls it after every test. */
export function resetExcusesState(): void {
  excuses = seedExcuses()
}

/** Puts an excuse at the head of the list (staff and admin tests). */
export function seedExcuse(item: Excuse): void {
  excuses = [item, ...excuses.filter((e) => e.id !== item.id)]
}

export function currentExcuses(): readonly Excuse[] {
  return excuses
}

function replace(item: Excuse): Excuse {
  excuses = excuses.map((e) => (e.id === item.id ? item : e))
  return item
}

function find(params: Parameters<typeof param>[0]): Excuse | undefined {
  const id = param(params, "id")
  return excuses.find((e) => e.id === id)
}

function listOf(request: Request, own: boolean) {
  const q = query(request)
  const status = q.get("status")
  const student = q.get("student_id")
  const items = excuses
    .filter((e) => (!own || e.student_id === ids.student) && (!status || e.status === status))
    .filter((e) => !student || e.student_id === student)
    .toSorted((a, b) => b.created_at.localeCompare(a.created_at))
  return HttpResponse.json(paginate(items, request))
}

function appendMessage(item: Excuse, body: ExcuseMessageBody, authorId: string, authorName: string): Excuse {
  const text = (body.body ?? "").trim()
  const fileIds = body.file_ids ?? []
  return replace({
    ...item,
    thread: [
      ...item.thread,
      {
        id: nextId(62),
        author_id: authorId,
        author_name: authorName,
        body: text,
        attachments: fileIds.map((fileId) => ({
          file_id: fileId,
          name: "document.pdf",
          mime: "application/pdf",
          size: 1024,
          download_url: `https://files.test/${fileId}`,
        })),
        created_at: FIXTURE_NOW,
      },
    ],
    updated_at: FIXTURE_NOW,
  })
}

function decide(
  item: Excuse,
  status: ExcuseStatus,
  comment: string | null | undefined,
  allowedFrom: ExcuseStatus,
): Response {
  if (item.status !== allowedFrom) {
    return problem(409, "academic/excuse-not-" + (allowedFrom === "pending" ? "pending" : "approved"), "Wrong state", {
      messageKey: allowedFrom === "pending" ? "excuse-not-pending" : "excuse-not-approved",
    })
  }
  return HttpResponse.json(
    replace({
      ...item,
      status,
      decided_by: ids.teacherKalandarova,
      decided_at: FIXTURE_NOW,
      decision_comment: comment ?? null,
      updated_at: FIXTURE_NOW,
    }),
  )
}

function staffAndAdminHandlers(prefix: "/v1/staff/excuses" | "/v1/admin/excuses") {
  const staff = prefix === "/v1/staff/excuses"
  const own = [
    http.get(apiUrl(prefix), ({ request }) => listOf(request, false)),
    http.get(apiUrl(`${prefix}/:id`), ({ params }) => {
      const item = find(params)
      return item ? HttpResponse.json(item) : notFound("Excuse")
    }),
    http.post(apiUrl(`${prefix}/:id/approve`), async ({ params, request }) => {
      const item = find(params)
      if (!item) return notFound("Excuse")
      return decide(item, "approved", (await readJson<ExcuseDecisionBody>(request)).comment, "pending")
    }),
    http.post(apiUrl(`${prefix}/:id/reject`), async ({ params, request }) => {
      const item = find(params)
      if (!item) return notFound("Excuse")
      return decide(item, "rejected", (await readJson<ExcuseDecisionBody>(request)).comment, "pending")
    }),
    http.post(apiUrl(`${prefix}/:id/messages`), async ({ params, request }) => {
      const item = find(params)
      if (!item) return notFound("Excuse")
      const body = await readJson<ExcuseMessageBody>(request)
      return HttpResponse.json(appendMessage(item, body, ids.teacherKalandarova, "Kalandarova Gavxar"), { status: 201 })
    }),
  ]
  if (!staff) return own
  return [
    ...own,
    http.post(apiUrl(prefix), async ({ request }) => {
      const body = await readJson<ExcuseExclusionBody>(request)
      const template = excuseTemplates.find((t) => t.id === body.template_id)
      if (!template || !body.student_id) return problem(422, "academic/excuse-invalid", "Invalid excuse")
      const created: Excuse = {
        id: nextId(61),
        student_id: body.student_id,
        student_name: "Brastilov Aleksey",
        origin: "curator",
        status: "approved",
        template,
        reason: body.reason ?? "",
        starts_on: body.starts_on ?? FIXTURE_TODAY,
        ends_on: body.ends_on ?? null,
        lesson_ids: body.lesson_ids ?? [],
        subject_ids: body.subject_ids ?? [],
        created_by: ids.teacherKalandarova,
        decided_by: ids.teacherKalandarova,
        decided_at: FIXTURE_NOW,
        decision_comment: null,
        created_at: FIXTURE_NOW,
        updated_at: FIXTURE_NOW,
        thread: [],
      }
      excuses = [created, ...excuses]
      return HttpResponse.json(created, { status: 201 })
    }),
    http.patch(apiUrl(`${prefix}/:id`), async ({ params, request }) => {
      const item = find(params)
      if (!item) return notFound("Excuse")
      const body = await readJson<ExcuseEndBody>(request)
      if (!body.ends_on || body.ends_on < item.starts_on)
        return problem(422, "academic/excuse-invalid", "Invalid excuse")
      return HttpResponse.json(replace({ ...item, ends_on: body.ends_on, updated_at: FIXTURE_NOW }))
    }),
    http.post(apiUrl(`${prefix}/:id/revoke`), async ({ params, request }) => {
      const item = find(params)
      if (!item) return notFound("Excuse")
      return decide(item, "cancelled", (await readJson<ExcuseDecisionBody>(request)).comment, "approved")
    }),
  ]
}

export const excusesHandlers = [
  http.get(apiUrl("/v1/me/excuse-templates"), () => HttpResponse.json({ items: excuseTemplates })),
  http.get(apiUrl("/v1/me/excuses"), ({ request }) => listOf(request, true)),
  http.post(apiUrl("/v1/me/excuses"), async ({ request }) => {
    const body = await readJson<ExcuseRequestBody>(request)
    const template = excuseTemplates.find((t) => t.id === body.template_id)
    if (!template || !body.starts_on) {
      return problem(422, "academic/excuse-invalid", "Invalid excuse", { messageKey: "excuse-invalid" })
    }
    if (template.requires_document && !(body.file_ids ?? []).length) {
      return problem(422, "academic/excuse-document-required", "Document required", {
        messageKey: "excuse-document-required",
      })
    }
    const created: Excuse = {
      id: nextId(61),
      student_id: ids.student,
      student_name: "Brastilov Aleksey",
      origin: "request",
      status: "pending",
      template,
      reason: body.reason ?? "",
      starts_on: body.starts_on,
      ends_on: body.ends_on ?? null,
      lesson_ids: body.lesson_ids ?? [],
      subject_ids: body.subject_ids ?? [],
      created_by: ids.student,
      decided_by: null,
      decided_at: null,
      decision_comment: null,
      created_at: FIXTURE_NOW,
      updated_at: FIXTURE_NOW,
      thread: [],
    }
    excuses = [created, ...excuses]
    return HttpResponse.json(created, { status: 201 })
  }),
  http.get(apiUrl("/v1/me/excuses/:id"), ({ params }) => {
    const item = find(params)
    return item && item.student_id === ids.student ? HttpResponse.json(item) : notFound("Excuse")
  }),
  http.post(apiUrl("/v1/me/excuses/:id/cancel"), ({ params }) => {
    const item = find(params)
    if (!item || item.student_id !== ids.student) return notFound("Excuse")
    if (item.status !== "pending" && item.status !== "approved") {
      return problem(409, "academic/excuse-not-pending", "Wrong state", { messageKey: "excuse-not-pending" })
    }
    return HttpResponse.json(replace({ ...item, status: "cancelled", updated_at: FIXTURE_NOW }))
  }),
  http.post(apiUrl("/v1/me/excuses/:id/messages"), async ({ params, request }) => {
    const item = find(params)
    if (!item || item.student_id !== ids.student) return notFound("Excuse")
    const body = await readJson<ExcuseMessageBody>(request)
    return HttpResponse.json(appendMessage(item, body, ids.student, "Brastilov Aleksey"), { status: 201 })
  }),
  ...staffAndAdminHandlers("/v1/staff/excuses"),
  ...staffAndAdminHandlers("/v1/admin/excuses"),
]
