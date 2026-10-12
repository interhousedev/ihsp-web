import type {
  StaffGroupMaterial,
  StaffSubjectMaterialCreateBody,
  StaffSubjectMaterials,
  SubjectMaterial,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { staffMaterials, staffMineMaterial, staffSubjectEmisIds, staffSubjects } from "../fixtures/staff-subjects"
import { subjectMaterials } from "../fixtures/subject-materials"
import { FIXTURE_NOW } from "../fixtures/world"
import { apiUrl, nextId, noContent, param, problem, readJson } from "./utils"

let mine: SubjectMaterial[] = [structuredClone(staffMineMaterial)]
let perGroup: StaffGroupMaterial[] = structuredClone(staffMaterials)

/** Resets the in-memory staff materials; called after every test by `preload.ts`. */
export function resetStaffSubjectsState(): void {
  mine = [structuredClone(staffMineMaterial)]
  perGroup = structuredClone(staffMaterials)
}

function notTaught() {
  return problem(403, "notebooks/subject-not-taught", "You do not teach this subject")
}

export const staffSubjectsHandlers = [
  http.get(apiUrl("/v1/staff/subjects"), () => HttpResponse.json(staffSubjects)),
  http.get(apiUrl("/v1/staff/subjects/:subjectId/materials"), ({ params }) => {
    const subject = staffSubjects.find((item) => item.subject_id === param(params, "subjectId"))
    if (!subject) return notTaught()
    const edu = staffSubjectEmisIds[subject.subject_id]
    const body: StaffSubjectMaterials = {
      subject,
      admin: subjectMaterials.filter((item) => item.edu_subject_id === edu),
      mine: mine.filter((item) => item.edu_subject_id === edu),
      groups: perGroup.filter((item) => item.edu_subject_id === edu),
    }
    return HttpResponse.json(body)
  }),
  http.post(apiUrl("/v1/staff/subjects/:subjectId/materials"), async ({ params, request }) => {
    const subject = staffSubjects.find((item) => item.subject_id === param(params, "subjectId"))
    if (!subject) return notTaught()
    const body = await readJson<StaffSubjectMaterialCreateBody>(request)
    const group = body.group_id ? subject.groups.find((item) => item.group_id === body.group_id) : undefined
    if (body.group_id && !group) return notTaught()
    const title = body.title?.trim() ?? ""
    const target = body.url?.trim() || body.file_id || body.library_item_id || null
    if (title === "" || target === null) {
      return problem(422, "notebooks/default-material-invalid", "The material is not valid")
    }
    const base: SubjectMaterial = {
      id: nextId(71),
      edu_subject_id: staffSubjectEmisIds[subject.subject_id] ?? 0,
      kind: body.kind ?? "link",
      title,
      url: body.kind === "link" ? target : null,
      file_id: body.kind === "file" ? target : null,
      library_item_id: body.kind === "library_item" ? target : null,
      position: 1,
      created_at: FIXTURE_NOW,
    }
    if (body.group_id && group) {
      perGroup = [
        ...perGroup,
        { ...base, group_id: group.group_id, group_name: group.group_name, subgroup: body.subgroup ?? null },
      ]
    } else {
      mine = [...mine, base]
    }
    return HttpResponse.json(base, { status: 201 })
  }),
  http.delete(apiUrl("/v1/staff/subjects/:subjectId/materials/:materialId"), ({ params }) => {
    const materialId = param(params, "materialId")
    if (![...mine, ...perGroup].some((item) => item.id === materialId)) {
      return problem(404, "notebooks/default-material-not-found", "The material was not found")
    }
    mine = mine.filter((item) => item.id !== materialId)
    perGroup = perGroup.filter((item) => item.id !== materialId)
    return noContent()
  }),
]
