import { describe, expect, test } from "bun:test"
import {
  ApiError,
  getAdminGroupCurriculum,
  getMeCurriculum,
  postAdminGroupCurriculumSync,
  type CurriculumView,
} from "@ihsp/api"
import { curriculumView } from "../fixtures/curriculum"
import { ids } from "../fixtures/world"

describe("curriculum handlers", () => {
  test("the fixture is a realistic curriculum: two semesters, every subject type, names missing in a language, exams", () => {
    expect(curriculumView.semesters.map((semester) => semester.number)).toEqual([3, 4])
    expect(
      curriculumView.semesters.filter((semester) => semester.is_current).map((semester) => semester.number),
    ).toEqual([curriculumView.current_semester ?? 0])
    const subjects = curriculumView.semesters.flatMap((semester) => semester.subjects)
    expect(new Set(subjects.map((subject) => subject.subject_type_id))).toEqual(new Set([1, 2, 3, 4, null]))
    expect(subjects.some((subject) => subject.name.ru === "")).toBe(true)
    expect(subjects.some((subject) => subject.name.en === "")).toBe(true)
    expect(subjects.some((subject) => subject.subject_id === null)).toBe(true)
    expect(subjects.some((subject) => subject.study_hours === null)).toBe(true)
    expect(curriculumView.exams.length).toBeGreaterThan(0)
    expect(curriculumView.speciality?.en).toBe("")
  })

  test("GET /v1/me/curriculum returns the stored curriculum", async () => {
    expect(await getMeCurriculum()).toEqual(curriculumView)
  })

  test("GET /v1/admin/groups/{id}/curriculum: stored for 2TN2, null for 1TN1, 404 for an unknown group", async () => {
    expect(await getAdminGroupCurriculum(ids.group2TN2)).toEqual(curriculumView)
    expect(await getAdminGroupCurriculum(ids.group1TN1)).toBeNull()
    const error = await getAdminGroupCurriculum("00000000-0000-4000-8000-0000000000ff").catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(404)
  })

  test("POST /v1/admin/groups/{id}/curriculum/sync: synced with the curriculum, or 409 without a usable student", async () => {
    const synced = await postAdminGroupCurriculumSync(ids.group2TN2)
    expect(synced.status).toBe("synced")
    expect((synced.curriculum as CurriculumView).emis_curriculum_id).toBe(curriculumView.emis_curriculum_id)
    const error = await postAdminGroupCurriculumSync(ids.group1TN1).catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).type).toBe("academic/curriculum-no-emis-student")
  })
})
