import type { SubjectMaterial, SubjectMaterialCreateBody } from "@ihsp/api"
import { HttpResponse, http, type PathParams } from "msw"
import { subjectMaterialGroups, subjectMaterials } from "../fixtures/subject-materials"
import { FIXTURE_NOW } from "../fixtures/world"
import { apiUrl, nextId, noContent, param, problem, readJson } from "./utils"

/** The backend allows 30 default materials per EMIS subject id. */
const LIMIT = 30

let store: SubjectMaterial[] = structuredClone(subjectMaterials)

/** Resets the in-memory default materials; called after every test by `preload.ts`. */
export function resetSubjectMaterialsState(): void {
  store = structuredClone(subjectMaterials)
}

function eduSubjectId(params: PathParams): number {
  const raw = param(params, "eduSubjectId")
  const value = Number(raw)
  return Number.isInteger(value) ? value : 0
}

function targetOf(body: Partial<SubjectMaterialCreateBody>): string | null {
  if (body.kind === "link") return body.url?.trim() || null
  if (body.kind === "file") return body.file_id ?? null
  if (body.kind === "library_item") return body.library_item_id ?? null
  return null
}

function sameTarget(item: SubjectMaterial, body: Partial<SubjectMaterialCreateBody>): boolean {
  if (item.kind !== body.kind) return false
  return (item.url ?? item.file_id ?? item.library_item_id) === targetOf(body)
}

export const subjectMaterialsHandlers = [
  http.post(apiUrl("/v1/admin/subject-materials/subjects/:subjectId/reconcile"), () =>
    HttpResponse.json({ job_id: "reconcile-job-admin", status: "queued" }, { status: 202 }),
  ),
  http.get(apiUrl("/v1/admin/subject-materials/subjects/:subjectId/reconcile/:jobId"), ({ params }) =>
    HttpResponse.json({
      job_id: String(params.jobId),
      status: "done",
      done: true,
      notebooks: 2,
      added: 1,
      already_present: 3,
      skipped: 0,
    }),
  ),
  http.get(apiUrl("/v1/admin/subject-materials"), () => HttpResponse.json(subjectMaterialGroups(store))),
  http.get(apiUrl("/v1/admin/subject-materials/:eduSubjectId"), ({ params }) => {
    const id = eduSubjectId(params)
    return HttpResponse.json(
      store.filter((item) => item.edu_subject_id === id).toSorted((a, b) => a.position - b.position),
    )
  }),
  http.post(apiUrl("/v1/admin/subject-materials/:eduSubjectId"), async ({ params, request }) => {
    const id = eduSubjectId(params)
    const body = await readJson<SubjectMaterialCreateBody>(request)
    const title = body.title?.trim() ?? ""
    const target = targetOf(body)
    if (id < 1 || title === "" || title.length > 255 || target === null) {
      return problem(422, "notebooks/default-material-invalid", "The material is not valid")
    }
    const own = store.filter((item) => item.edu_subject_id === id)
    if (own.some((item) => sameTarget(item, body))) {
      return problem(409, "notebooks/default-material-exists", "The material is already there")
    }
    if (own.length >= LIMIT) {
      return problem(409, "notebooks/default-material-limit", "The subject has the most default materials")
    }
    const created: SubjectMaterial = {
      id: nextId(70),
      edu_subject_id: id,
      kind: body.kind ?? "link",
      title,
      url: body.kind === "link" ? target : null,
      file_id: body.kind === "file" ? target : null,
      library_item_id: body.kind === "library_item" ? target : null,
      position: own.reduce((last, item) => Math.max(last, item.position), 0) + 1,
      created_at: FIXTURE_NOW,
    }
    store = [...store, created]
    return HttpResponse.json(created, { status: 201 })
  }),
  http.delete(apiUrl("/v1/admin/subject-materials/:eduSubjectId/:materialId"), ({ params }) => {
    const id = eduSubjectId(params)
    const materialId = param(params, "materialId")
    if (!store.some((item) => item.edu_subject_id === id && item.id === materialId)) {
      return problem(404, "notebooks/default-material-not-found", "The default material was not found")
    }
    store = store.filter((item) => item.id !== materialId)
    return noContent()
  }),
]
