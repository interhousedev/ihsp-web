import { describe, expect, test } from "bun:test"
import {
  getAdminLessonSources,
  getStaffEmisSourcesHidden,
  getStaffLessonSources,
  postLessonResourceHide,
  putStaffEmisSourcesHidden,
} from "@ihsp/api"
import { lessonSourceIds, lessonSourcesSubjectId } from "../fixtures/lesson-sources"
import { ids } from "../fixtures/world"

describe("lesson sources handlers", () => {
  test("lists EMIS sources only by default and all with origin=all, paged", async () => {
    const emis = await getAdminLessonSources(lessonSourcesSubjectId)
    const all = await getAdminLessonSources(lessonSourcesSubjectId, { origin: "all", limit: 2, offset: 2 })

    expect(emis.total).toBe(4)
    expect(emis.items.map((item) => item.link_id)).not.toContain(lessonSourceIds.userUrl)
    expect(all.total).toBe(5)
    expect(all.items).toHaveLength(2)
  })

  test("filters by group and refuses a subject the teacher does not teach", async () => {
    const page = await getStaffLessonSources(lessonSourcesSubjectId, { group_id: ids.group1TN1 })
    expect(page.items.map((item) => item.link_id)).toEqual([lessonSourceIds.otherGroupUrl])
    await expect(getStaffLessonSources(ids.physics)).rejects.toThrow()
  })

  test("hides one source and applies the group rule", async () => {
    await postLessonResourceHide("lesson", lessonSourceIds.emisUrl, { hidden: true })
    const rule = await putStaffEmisSourcesHidden(lessonSourcesSubjectId, ids.group2TN2, { hidden: true })
    const page = await getStaffLessonSources(lessonSourcesSubjectId, { group_id: ids.group2TN2 })

    expect(rule).toEqual({ hidden: true, affected: 3 })
    expect(page.items.every((item) => item.hidden)).toBe(true)
    expect((await getStaffEmisSourcesHidden(lessonSourcesSubjectId, ids.group2TN2)).hidden).toBe(true)
  })
})
