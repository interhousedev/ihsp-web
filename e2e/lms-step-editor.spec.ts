/**
 * LMS step editor of a course author: "Add block" opens the step type picker, a video block takes a link or an uploaded
 * MP4 (the bytes go to object storage through a presigned URL), and the edits are autosaved (the status line shows
 * "Saved"). The spec puts the step back to its draft content afterwards.
 */

import type { CourseDraft, MyCourses, StepDraft } from "@ihsp/api"
import type { Page } from "@playwright/test"
import { TEACHER } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { unique } from "./fixtures/data"
import { URLS } from "./fixtures/env"
import { videoFile } from "./fixtures/files"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"

const COURSE_TITLE = "Derivatives 101"

/** The status line of the editor (`SaveIndicator`): `data-status="saved"` once the last edit is stored. */
function savedStatus(page: Page) {
  return page.locator('[role="status"][data-status="saved"]')
}

test("LMS step editor: add a video block by link and by upload, autosave, restore", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, TEACHER, "lms", { path: "/my/" })
  const mine = await api<MyCourses>(page, "GET", "/v1/lms/my-courses")
  const course = mine.managed.find((item) => item.title === COURSE_TITLE) ?? mine.managed[0]
  test.skip(!course, `${TEACHER.login} manages no course (run seed-demo)`)
  if (!course) return

  const draft = await api<CourseDraft>(page, "GET", `/v1/lms/courses/${course.id}/draft`)
  const stepId = draft.outline.flatMap((section) => section.steps)[0]?.step_id
  test.skip(!stepId, "the demo course has no steps")
  if (!stepId) return
  const original = await api<StepDraft>(page, "GET", `/v1/lms/steps/${stepId}/draft`)
  const caption = unique("e2e caption")

  try {
    await page.goto(`${URLS.lms}/edit/step/?id=${stepId}`)
    await expect(page.getByRole("button", { name: "Add block", exact: true })).toBeVisible()
    await a11y(page, testInfo, { label: "lms step editor blocks" })

    // 1. The step type picker lists the types in groups; "Video" adds a video block.
    await page.getByRole("button", { name: "Add block", exact: true }).click()
    const picker = page.getByRole("dialog", { name: "Choose a step type" })
    await expect(picker).toBeVisible()
    await expect(picker.getByRole("heading", { name: "Materials" })).toBeVisible()
    await expect(picker.getByRole("heading", { name: "Test tasks" })).toBeVisible()
    await expect(picker.getByRole("heading", { name: "Tasks with a typed answer" })).toBeVisible()
    await a11y(page, testInfo, { label: "lms step type picker" })
    await picker.locator('[data-step-type="video"]').click()
    await expect(picker).toBeHidden()

    // 2. A link as the video source, and a caption; the edits are autosaved.
    await expect(page.getByLabel("Video link").last()).toBeVisible()
    await page.getByLabel("Video link").last().fill("https://example.org/lectures/derivatives.mp4")
    await page.getByLabel("Caption (optional)").last().fill(caption)
    await expect(savedStatus(page)).toBeVisible({ timeout: 30_000 })

    // 3. Upload an MP4 instead: the block shows "Replace video" once the file is stored.
    await page.getByLabel("Video file (MP4, WebM or MOV)").last().setInputFiles(videoFile())
    await expect(page.getByRole("button", { name: "Replace video" }).last()).toBeVisible({ timeout: 90_000 })
    await expect(savedStatus(page)).toBeVisible({ timeout: 30_000 })

    // 4. The stored draft has the uploaded file and the caption; a reload shows them again.
    await expect
      .poll(async () => JSON.stringify((await api<StepDraft>(page, "GET", `/v1/lms/steps/${stepId}/draft`)).content))
      .toContain(caption)
    const stored = await api<StepDraft>(page, "GET", `/v1/lms/steps/${stepId}/draft`)
    const videos = stored.content.blocks.flatMap((block) =>
      block.type === "video" && block.caption === caption ? [block] : [],
    )
    expect(videos, "the video block with the caption is stored").toHaveLength(1)
    expect(videos[0]?.source).toBe("upload")
    await page.reload()
    await expect(page.getByRole("button", { name: "Replace video" }).last()).toBeVisible()
    await expect(page.getByLabel("Caption (optional)").last()).toHaveValue(caption)
  } finally {
    // Restore the draft the course had before the spec ran (the step keeps its other blocks).
    const current = await api<StepDraft>(page, "GET", `/v1/lms/steps/${stepId}/draft`)
    await api(page, "PUT", `/v1/lms/steps/${stepId}/draft`, {
      content: original.content,
      lock_version: current.lock_version,
    })
  }
})
