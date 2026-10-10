import { describe, expect, test } from "bun:test"
import {
  ApiError,
  deleteAdminSubjectMaterial,
  getAdminSubjectMaterialGroups,
  getAdminSubjectMaterials,
  postAdminSubjectMaterial,
} from "@ihsp/api"
import { subjectMaterialIds } from "../fixtures/subject-materials"

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ApiError) return error
  }
  throw new Error("The request did not fail")
}

describe("subject materials handlers", () => {
  test("lists the groups by EMIS id and the materials of one id by position", async () => {
    const groups = await getAdminSubjectMaterialGroups()
    expect(groups.map((group) => group.edu_subject_id)).toEqual([101, 103, 9001])
    const math = await getAdminSubjectMaterials(101)
    expect(math.map((item) => item.position)).toEqual([1, 2])
    expect(await getAdminSubjectMaterials(555)).toEqual([])
  })

  test("adds a material at the end of the list, and the new one shows in the groups", async () => {
    const created = await postAdminSubjectMaterial(103, {
      kind: "link",
      title: "Grammar quiz",
      url: "https://example.org/q",
    })
    expect(created).toMatchObject({ edu_subject_id: 103, kind: "link", position: 2, file_id: null })
    const group = (await getAdminSubjectMaterialGroups()).find((item) => item.edu_subject_id === 103)
    expect(group?.materials.map((item) => item.title)).toEqual(["English Grammar in Use", "Grammar quiz"])
  })

  test("refuses a material twice (409), without a target (422) and a missing one on delete (404)", async () => {
    const same = { kind: "link", title: "Again", url: "https://example.org/algebra-tables" } as const
    expect((await failure(postAdminSubjectMaterial(101, same))).type).toBe("notebooks/default-material-exists")
    const none = { kind: "file", title: "No file" } as const
    expect((await failure(postAdminSubjectMaterial(101, none))).type).toBe("notebooks/default-material-invalid")
    const gone = await failure(deleteAdminSubjectMaterial(101, subjectMaterialIds.englishBook))
    expect(gone.type).toBe("notebooks/default-material-not-found")
  })

  test("stops at 30 materials of an id (409)", async () => {
    for (let n = 0; n < 29; n += 1) {
      await postAdminSubjectMaterial(2000, { kind: "link", title: `Link ${n}`, url: `https://example.org/${n}` })
    }
    const extra = { kind: "link", title: "One more", url: "https://example.org/extra" } as const
    await postAdminSubjectMaterial(2000, { kind: "link", title: "Thirtieth", url: "https://example.org/30" })
    expect((await failure(postAdminSubjectMaterial(2000, extra))).type).toBe("notebooks/default-material-limit")
  })

  test("removes a material", async () => {
    await deleteAdminSubjectMaterial(101, subjectMaterialIds.mathLink)
    expect((await getAdminSubjectMaterials(101)).map((item) => item.id)).toEqual([subjectMaterialIds.mathFile])
  })
})
