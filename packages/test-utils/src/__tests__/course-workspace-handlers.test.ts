import { describe, expect, test } from "bun:test"
import {
  getAiChats,
  getArtifact,
  getCourseSteps,
  getNotebook,
  getNotebookUsageOf,
  postAiChats,
  postApplyArtifact,
  postApplyPreview,
  postCourseWorkspace,
} from "@ihsp/api"
import { applyResultPlan, courseIds } from "../fixtures/course-workspace"
import { setCourseApplyMode } from "../handlers"

describe("course workspace handlers", () => {
  test("opens the workspace of a course and serves it as a notebook of that course", async () => {
    const opened = await postCourseWorkspace({ course_id: courseIds.course })
    const notebook = await getNotebook(opened.notebook_id)

    expect(opened.can_write).toBe(true)
    expect(notebook.course_id).toBe(courseIds.course)
    expect(notebook.can_write).toBe(true)
  })

  test("serves the draft outline, the budget and the course outputs", async () => {
    const outline = await getCourseSteps(courseIds.workspace)
    const usage = await getNotebookUsageOf(courseIds.workspace)
    const plan = await getArtifact(courseIds.workspace, courseIds.coursePlan)
    const lesson = await getArtifact(courseIds.workspace, courseIds.lessonDraft)

    expect(outline.sections.map((section) => section.title)).toEqual(["Introduction", "Motion"])
    expect(usage.budget.session.limit).toBeGreaterThan(0)
    expect(plan.kind === "course_plan" && plan.content?.sections).toHaveLength(2)
    expect(lesson.kind === "lesson_draft" && lesson.content?.blocks.map((block) => block.type)).toEqual([
      "text",
      "test",
      "flashcards",
    ])
  })

  test("previews and applies a plan; a stale step answers 409 once", async () => {
    const preview = await postApplyPreview(courseIds.workspace, courseIds.coursePlan, { add_briefs: true })
    expect(preview.plan?.new_steps).toBe(2)

    setCourseApplyMode("conflict")
    await expect(postApplyArtifact(courseIds.workspace, courseIds.coursePlan, {})).rejects.toMatchObject({
      status: 409,
    })
    expect(await postApplyArtifact(courseIds.workspace, courseIds.coursePlan, {})).toEqual(applyResultPlan)
  })

  test("reports the problems of a draft the server refuses", async () => {
    setCourseApplyMode("invalid")
    const preview = await postApplyPreview(courseIds.workspace, courseIds.lessonDraft, {
      target_step_id: courseIds.stepNewLaws,
    })

    expect(preview.can_apply).toBe(false)
    expect(preview.problems).toHaveLength(1)
  })

  test("lists and creates the author chats of a course", async () => {
    const chats = await getAiChats({ assistant: "lms_author", course_id: courseIds.course })
    const created = await postAiChats({ assistant: "lms_author", course_id: courseIds.course })

    expect(chats.items.map((chat) => chat.id)).toEqual([courseIds.authorChat])
    expect(created.course_id).toBe(courseIds.course)
    expect((await getAiChats({ assistant: "student" })).items.every((chat) => chat.course_id === null)).toBe(true)
  })
})
