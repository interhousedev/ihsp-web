// A teacher's subject groups: students, timetable and one student's record (read-only).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { TeachingGroup, TeachingStudent } from "../types/staff-subjects"

/** GET /v1/staff/subjects/{id}/groups/{group_id}[/subgroups/{n}] — teacher of the group, or admin; `403 academic/not-teaching-group`. */
export function getTeachingGroup(
  subjectId: string,
  groupId: string,
  subgroup: number | null,
  opts?: RequestOptions,
): Promise<TeachingGroup> {
  if (subgroup === null) {
    return api.get<TeachingGroup>(`/v1/staff/subjects/${seg(subjectId)}/groups/${seg(groupId)}`, opts)
  }
  return api.get<TeachingGroup>(
    `/v1/staff/subjects/${seg(subjectId)}/groups/${seg(groupId)}/subgroups/${seg(String(subgroup))}`,
    opts,
  )
}
export const getTeachingGroupQuery = (subjectId: string, groupId: string, subgroup: number | null) =>
  queryOptions({
    queryKey: keys.staffSubjects.group(subjectId, groupId, subgroup),
    queryFn: ({ signal }) => getTeachingGroup(subjectId, groupId, subgroup, { signal }),
  })

/** GET .../students/{student_id} — `403 academic/not-teaching-group`, `404 academic/student-not-in-group`. */
export function getTeachingStudent(
  subjectId: string,
  groupId: string,
  subgroup: number | null,
  studentId: string,
  opts?: RequestOptions,
): Promise<TeachingStudent> {
  if (subgroup === null) {
    return api.get<TeachingStudent>(
      `/v1/staff/subjects/${seg(subjectId)}/groups/${seg(groupId)}/students/${seg(studentId)}`,
      opts,
    )
  }
  return api.get<TeachingStudent>(
    `/v1/staff/subjects/${seg(subjectId)}/groups/${seg(groupId)}/subgroups/${seg(String(subgroup))}/students/${seg(studentId)}`,
    opts,
  )
}
export const getTeachingStudentQuery = (
  subjectId: string,
  groupId: string,
  subgroup: number | null,
  studentId: string,
) =>
  queryOptions({
    queryKey: keys.staffSubjects.student(subjectId, groupId, subgroup, studentId),
    queryFn: ({ signal }) => getTeachingStudent(subjectId, groupId, subgroup, studentId, { signal }),
  })
