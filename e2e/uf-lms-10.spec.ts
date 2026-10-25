/**
 * UF-LMS-10: a course author edits a step in the draft and publishes. The publish page lists the pending change, the
 * version list gets a new version, and a learner sees the new text. The author is the account that manages
 * "Derivatives 101" in the seed (a teacher); Administration is tried as a fallback.
 */

import type { CourseDraft, MyCourses, PendingChanges, StepDraft, StepView, VersionItem } from "@ihsp/api"
import type { Page } from "@playwright/test"
import { ADMIN, STUDENT, TEACHER, type Account } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { unique } from "./fixtures/data"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading } from "./fixtures/ui"

const COURSE_TITLE = "Derivatives 101"

/** Signs in as the first account that manages the demo course. */
async function signInAsAuthor(page: Page): Promise<{ account: Account; courseId: string } | null> {
  for (const account of [TEACHER, ADMIN]) {
    await loginAs(page, account, "lms", { path: "/my/" })
    const mine = await api<MyCourses>(page, "GET", "/v1/lms/my-courses")
    const course = mine.managed.find((item) => item.title === COURSE_TITLE) ?? mine.managed[0]
    if (course) return { account, courseId: course.id }
    // Try the next account in a clean browser state.
    await page.context().clearCookies()
    await page.evaluate(() => window.sessionStorage.clear())
  }
  return null
}

test("UF-LMS-10 edit a step, review the pending change and publish", async ({ page }, testInfo) => {
  test.slow()
  const author = await signInAsAuthor(page)
  test.skip(!author, `neither ${TEACHER.login} nor ${ADMIN.login} manages a course (run seed-demo)`)
  if (!author) return
  const { courseId } = author

  const draft = await api<CourseDraft>(page, "GET", `/v1/lms/courses/${courseId}/draft`)
  const stepId = draft.outline.flatMap((section) => section.steps)[0]?.step_id
  test.skip(!stepId, "the demo course has no steps")
  if (!stepId) return
  const versionsBefore = await api<VersionItem[]>(page, "GET", `/v1/lms/courses/${courseId}/versions`)
  const marker = unique("e2e edit")

  // 1. Edit the first text block in the step editor and save the draft.
  await page.goto(`${URLS.lms}/edit/step/?id=${stepId}`)
  const editor = page.getByRole("textbox", { name: /^Markdown of block / }).first()
  await expect(editor).toBeVisible()
  await a11y(page, testInfo, { label: "lms step editor" })
  const original = await editor.inputValue()
  await editor.fill(`${original}\n\n${marker}`)
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(page.getByText(/Saved/).first()).toBeVisible()

  // 2. The publish page lists the change; publish it with a note.
  await page.goto(`${URLS.lms}/edit/publish/?id=${courseId}`)
  await expect(heading(page, "Publish", 1)).toBeVisible()
  await expect(page.getByText(/\d+ added, \d+ changed, \d+ removed\./)).toBeVisible()
  await a11y(page, testInfo, { label: "lms publish" })
  await page.getByLabel("Note (optional)").fill(`e2e ${marker}`)
  await page.getByRole("button", { name: "Publish", exact: true }).click()
  await expect(page.getByText(/^Published as version \d+/)).toBeVisible({ timeout: 30_000 })

  // 3. The version list has one more version, and its live content has the edit.
  const versionsAfter = await api<VersionItem[]>(page, "GET", `/v1/lms/courses/${courseId}/versions`)
  expect(versionsAfter.length).toBe(versionsBefore.length + 1)
  await page.goto(`${URLS.lms}/edit/versions/?id=${courseId}`)
  await expect(heading(page, "Versions", 1)).toBeVisible()
  await expect(page.getByText(`Version ${versionsAfter[0]?.number ?? 0}`).first()).toBeVisible()
  const live = await api<StepView>(page, "GET", `/v1/lms/courses/${courseId}/steps/${stepId}`)
  expect(JSON.stringify(live.blocks)).toContain(marker)

  // 4. Undo the change with a second publish so the demo course keeps its text.
  const current = await api<StepDraft>(page, "GET", `/v1/lms/steps/${stepId}/draft`)
  await api(page, "PUT", `/v1/lms/steps/${stepId}/draft`, {
    content: {
      ...current.content,
      blocks: current.content.blocks.map((block) =>
        block.type === "text" ? { ...block, markdown: block.markdown.replace(`\n\n${marker}`, "") } : block,
      ),
    },
    lock_version: current.lock_version,
  })
  const pending = await api<PendingChanges>(page, "GET", `/v1/lms/courses/${courseId}/pending`)
  await api(page, "POST", `/v1/lms/courses/${courseId}/publish`, { draft_seq: pending.draft_seq, note: "e2e restore" })
})

test("UF-LMS-10 a learner sees the catalog and the course page", async ({ page }, testInfo) => {
  await loginAs(page, STUDENT, "lms")
  await expect(heading(page, "Courses", 1)).toBeVisible()
  await a11y(page, testInfo, { label: "lms catalog" })
  await expect(page.getByText(COURSE_TITLE).first()).toBeVisible()
  await page.getByText(COURSE_TITLE).first().click()
  await expect(page).toHaveURL(new RegExp(`^${URLS.lms}/course/\\?slug=`))
  await expect(
    page
      .getByRole("button", { name: /^(Enroll|Continue)$/ })
      .or(page.getByRole("link", { name: /^(Enroll|Continue)$/ }))
      .first(),
  ).toBeVisible()
  await a11y(page, testInfo, { label: "lms course" })
})
