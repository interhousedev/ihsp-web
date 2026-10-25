import type { WorkOffItem, WorkOffPatchBody, WorkOffTemplate, WorkOffTemplateBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { workOffTemplates } from "../fixtures/work-offs-staff"
import { FIXTURE_NOW } from "../fixtures/world"
import { apiUrl, nextId, noContent, notFound, param, problem, readJson } from "./utils"

const MAX_TEMPLATES = 20

let templates: WorkOffTemplate[] = structuredClone(workOffTemplates)
let workOffs: WorkOffItem[] = []

/** Resets the in-memory templates and work-offs; called after every test by `preload.ts`. */
export function resetWorkOffsStaffState(): void {
  templates = structuredClone(workOffTemplates)
  workOffs = []
}

/** Puts work-offs on the lessons' attendance sheets (`staffLessonFor`). */
export function seedStaffWorkOffs(items: WorkOffItem[]): void {
  workOffs = structuredClone(items)
}

export function staffWorkOffsOf(lessonId: string): WorkOffItem[] {
  return workOffs.filter((item) => item.lesson_id === lessonId)
}

function withDefault(list: WorkOffTemplate[], id: string, isDefault: boolean): WorkOffTemplate[] {
  return list.map((item) => (isDefault ? { ...item, is_default: item.id === id } : item))
}

export const workOffsStaffHandlers = [
  http.get(apiUrl("/v1/staff/work-off-templates"), () => HttpResponse.json(templates)),
  http.post(apiUrl("/v1/staff/work-off-templates"), async ({ request }) => {
    if (templates.length >= MAX_TEMPLATES) {
      return problem(422, "work-off/template-limit", "Too many templates", { params: { max: MAX_TEMPLATES } })
    }
    const body = await readJson<WorkOffTemplateBody>(request)
    const created: WorkOffTemplate = {
      id: nextId(0x5a),
      text: body.text ?? "",
      is_default: body.is_default ?? false,
      created_at: FIXTURE_NOW,
      updated_at: FIXTURE_NOW,
    }
    templates = [...withDefault(templates, created.id, created.is_default), created]
    return HttpResponse.json(created, { status: 201 })
  }),
  http.put(apiUrl("/v1/staff/work-off-templates/:id"), async ({ params, request }) => {
    const id = param(params, "id")
    const current = templates.find((item) => item.id === id)
    if (!current) return notFound("Work-off template")
    const body = await readJson<WorkOffTemplateBody>(request)
    const updated: WorkOffTemplate = {
      ...current,
      text: body.text ?? current.text,
      is_default: body.is_default ?? false,
      updated_at: FIXTURE_NOW,
    }
    templates = withDefault(templates, id, updated.is_default).map((item) => (item.id === id ? updated : item))
    return HttpResponse.json(updated)
  }),
  http.delete(apiUrl("/v1/staff/work-off-templates/:id"), ({ params }) => {
    const id = param(params, "id")
    if (!templates.some((item) => item.id === id)) return notFound("Work-off template")
    templates = templates.filter((item) => item.id !== id)
    return noContent()
  }),
  http.patch(apiUrl("/v1/staff/work-offs/:id"), async ({ params, request }) => {
    const id = param(params, "id")
    const current = workOffs.find((item) => item.id === id)
    if (!current) return notFound("Work-off")
    const body = await readJson<WorkOffPatchBody>(request)
    const status = body.status ?? current.status
    const updated: WorkOffItem = {
      ...current,
      text: body.text ?? current.text,
      due_date: body.due_date === undefined ? current.due_date : body.due_date,
      status,
      done_at: status === "done" ? (current.done_at ?? FIXTURE_NOW) : null,
      updated_at: FIXTURE_NOW,
    }
    workOffs = workOffs.map((item) => (item.id === id ? updated : item))
    return HttpResponse.json(updated)
  }),
  http.delete(apiUrl("/v1/staff/work-offs/:id"), ({ params }) => {
    const id = param(params, "id")
    if (!workOffs.some((item) => item.id === id)) return notFound("Work-off")
    workOffs = workOffs.filter((item) => item.id !== id)
    return noContent()
  }),
]
