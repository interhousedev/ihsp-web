import type { SubjectMaterial, SubjectMaterialGroup } from "@ihsp/api"
import { uuid } from "./world"

/** Ids of the default materials below; kind 70 is free in `uuid`. */
export const subjectMaterialIds = {
  mathLink: uuid(70, 1),
  mathFile: uuid(70, 2),
  englishBook: uuid(70, 3),
  rawLink: uuid(70, 4),
  libraryItem: uuid(70, 11),
  file: uuid(70, 12),
}

/** Default materials by EMIS subject id: 101 (Mathematics) and 103 (English) are subjects of the demo world; 9001 is not. */
export const subjectMaterials: SubjectMaterial[] = [
  {
    id: subjectMaterialIds.mathLink,
    edu_subject_id: 101,
    kind: "link",
    title: "Algebra reference tables",
    url: "https://example.org/algebra-tables",
    file_id: null,
    library_item_id: null,
    position: 1,
    created_at: "2026-09-01T08:00:00Z",
  },
  {
    id: subjectMaterialIds.mathFile,
    edu_subject_id: 101,
    kind: "file",
    title: "Mathematics handbook.pdf",
    url: null,
    file_id: subjectMaterialIds.file,
    library_item_id: null,
    position: 2,
    created_at: "2026-09-01T08:05:00Z",
  },
  {
    id: subjectMaterialIds.englishBook,
    edu_subject_id: 103,
    kind: "library_item",
    title: "English Grammar in Use",
    url: null,
    file_id: null,
    library_item_id: subjectMaterialIds.libraryItem,
    position: 1,
    created_at: "2026-09-02T09:00:00Z",
  },
  {
    id: subjectMaterialIds.rawLink,
    edu_subject_id: 9001,
    kind: "link",
    title: "Syllabus of the new subject",
    url: "https://example.org/new-subject",
    file_id: null,
    library_item_id: null,
    position: 1,
    created_at: "2026-09-03T10:00:00Z",
  },
]

/** `GET /v1/admin/subject-materials`: the materials grouped by EMIS subject id, ordered by id. */
export function subjectMaterialGroups(materials: readonly SubjectMaterial[]): SubjectMaterialGroup[] {
  const ids = [...new Set(materials.map((item) => item.edu_subject_id))].toSorted((a, b) => a - b)
  return ids.map((id) => ({
    edu_subject_id: id,
    materials: materials.filter((item) => item.edu_subject_id === id).toSorted((a, b) => a.position - b.position),
  }))
}
