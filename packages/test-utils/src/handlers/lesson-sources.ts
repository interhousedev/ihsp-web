import type { EmisSourcesHidden, EmisSourcesHiddenBody, LessonSourceItem, LessonSourcePage } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { lessonSources, lessonSourcesSubjectId } from "../fixtures/lesson-sources"
import { staffSubjects } from "../fixtures/staff-subjects"
import { apiUrl, param, problem, query, readJson } from "./utils"

let items: LessonSourceItem[] = structuredClone(lessonSources)
let ruleGroups = new Set<string>()

/** Resets the in-memory lesson sources and group rules; called after every test by `preload.ts`. */
export function resetLessonSourcesState(): void {
  items = structuredClone(lessonSources)
  ruleGroups = new Set()
}

function pageOf(subjectId: string, request: Request): LessonSourcePage {
  const search = query(request)
  const groupId = search.get("group_id")
  const origin = search.get("origin") ?? "emis"
  const limit = Math.min(Math.max(Number(search.get("limit") ?? 50) || 50, 1), 200)
  const offset = Math.max(Number(search.get("offset") ?? 0) || 0, 0)
  const rows =
    subjectId === lessonSourcesSubjectId
      ? items.filter((item) => (!groupId || item.group_id === groupId) && (origin === "all" || item.source === "emis"))
      : []
  return { items: rows.slice(offset, offset + limit), total: rows.length, limit, offset }
}

function taughtGroup(subjectId: string, groupId: string): boolean {
  return (
    staffSubjects.find((item) => item.subject_id === subjectId)?.groups.some((item) => item.group_id === groupId) ??
    false
  )
}

function notTeachingSubject() {
  return problem(403, "links/not-teaching-subject", "You do not teach this subject")
}

function ruleResponse(groupId: string, affected = 0): EmisSourcesHidden {
  return { hidden: ruleGroups.has(groupId), affected }
}

export const lessonSourcesHandlers = [
  http.get(apiUrl("/v1/admin/subjects/:subjectId/lesson-sources"), ({ params, request }) =>
    HttpResponse.json(pageOf(param(params, "subjectId"), request)),
  ),
  http.get(apiUrl("/v1/staff/subjects/:subjectId/lesson-sources"), ({ params, request }) => {
    const subjectId = param(params, "subjectId")
    if (!staffSubjects.some((item) => item.subject_id === subjectId)) return notTeachingSubject()
    return HttpResponse.json(pageOf(subjectId, request))
  }),
  http.get(apiUrl("/v1/staff/subjects/:subjectId/groups/:groupId/emis-sources-hidden"), ({ params }) => {
    if (!taughtGroup(param(params, "subjectId"), param(params, "groupId"))) return notTeachingSubject()
    return HttpResponse.json(ruleResponse(param(params, "groupId")))
  }),
  http.put(apiUrl("/v1/staff/subjects/:subjectId/groups/:groupId/emis-sources-hidden"), async ({ params, request }) => {
    const groupId = param(params, "groupId")
    if (!taughtGroup(param(params, "subjectId"), groupId)) return notTeachingSubject()
    const body = await readJson<EmisSourcesHiddenBody>(request)
    const hidden = body.hidden === true
    let affected = 0
    items = items.map((item) => {
      if (item.group_id !== groupId || item.source !== "emis" || item.hidden_by_rule === hidden) return item
      affected += 1
      return { ...item, hidden_by_rule: hidden, hidden: hidden || false }
    })
    if (hidden) ruleGroups.add(groupId)
    else ruleGroups.delete(groupId)
    return HttpResponse.json(ruleResponse(groupId, affected))
  }),
  // Hides one lesson source; any other lesson resource falls through to the links handlers.
  http.post(apiUrl("/v1/lessons/:lessonId/resources/:linkId/hide"), async ({ params, request }) => {
    const found = items.find((item) => item.link_id === param(params, "linkId"))
    if (!found) return undefined
    const body = await readJson<{ hidden: boolean }>(request)
    items = items.map((item) => (item === found ? { ...item, hidden: body.hidden === true } : item))
    return HttpResponse.json({
      link_id: found.link_id,
      lesson_id: found.lesson_id,
      role: "material",
      kind: found.kind,
      short_url: found.short_url,
      title: found.name,
      author: { id: "", first_name: "EMIS", last_name: "" },
      hidden: body.hidden === true,
      file: found.file,
      created_at: "2026-10-07T05:12:00Z",
      source: found.source,
    })
  }),
]
