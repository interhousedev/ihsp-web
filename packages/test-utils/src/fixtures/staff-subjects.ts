import type { StaffGroupMaterial, StaffSubject } from "@ihsp/api"
import { ids, uuid } from "./world"

/** Ids of the teacher's own subject materials; kind 71 is free in `uuid`. */
export const staffMaterialIds = {
  mathMine: uuid(71, 1),
  mathGroup: uuid(71, 2),
}

/** The subjects the demo teacher teaches: Mathematics to 2TN2, English to the two halves of 2TN2. */
export const staffSubjects: StaffSubject[] = [
  {
    subject_id: ids.english,
    name: "English",
    groups: [
      { group_id: ids.group2TN2, group_name: "2TN2", subgroup: 1 },
      { group_id: ids.group2TN2, group_name: "2TN2", subgroup: 2 },
    ],
  },
  {
    subject_id: ids.math,
    name: "Mathematics",
    groups: [{ group_id: ids.group2TN2, group_name: "2TN2", subgroup: null }],
  },
]

/** The EMIS ids of the subjects above, as in `subjectMaterials`. */
export const staffSubjectEmisIds: Record<string, number> = { [ids.math]: 101, [ids.english]: 103 }

/** The teacher's own materials to start with: one for all groups and one for 2TN2 of Mathematics. */
export const staffMaterials: StaffGroupMaterial[] = [
  {
    id: staffMaterialIds.mathGroup,
    edu_subject_id: 101,
    kind: "link",
    title: "2TN2 problem set",
    url: "https://example.org/problem-set",
    file_id: null,
    library_item_id: null,
    position: 1,
    created_at: "2026-09-10T08:00:00Z",
    group_id: ids.group2TN2,
    group_name: "2TN2",
    subgroup: null,
  },
]

/** A material for all the teacher's groups (no group). */
export const staffMineMaterial = {
  id: staffMaterialIds.mathMine,
  edu_subject_id: 101,
  kind: "link" as const,
  title: "My Mathematics cheat sheet",
  url: "https://example.org/cheat-sheet",
  file_id: null,
  library_item_id: null,
  position: 1,
  created_at: "2026-09-09T08:00:00Z",
}
