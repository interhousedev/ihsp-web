/**
 * LMS code blocks end to end: an author adds Python, JavaScript and SQL code blocks (the Python one graded, with a
 * hidden test) and publishes; a student runs each in the browser sandbox and submits the Python one, which fetches the
 * hidden test, runs it and saves the score; the author runs the solution against the tests. The spec restores the
 * step and publishes again. Screenshots go to E2E_SHOT_DIR (/tmp/qa15).
 */

import type { CodeBlock, CourseDraft, MyCourses, PendingChanges, StepDraft } from "@ihsp/api"
import type { Browser, Page } from "@playwright/test"
import { STUDENT, TEACHER } from "./fixtures/accounts"
import { api, trackToken } from "./fixtures/api"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { expect, test } from "./fixtures/test"

const SHOTS = process.env.E2E_SHOT_DIR ?? "/tmp/qa15"
const COURSE_TITLE = "Derivatives 101"

const PYTHON: CodeBlock = {
  id: "e2e-code-py",
  type: "code",
  language: "python",
  instructions: "Write `add(a, b)` that returns the sum.",
  starter: "def add(a, b):\n    return a - b\n\nprint(add(2, 3))\n",
  solution: "def add(a, b):\n    return a + b\n",
  tests: [
    { id: "visible", name: "2 + 3", code: "assert add(2, 3) == 5", hidden: false },
    { id: "secret", name: "Negative numbers", code: "assert add(-4, 1) == -3", hidden: true },
  ],
  time_limit_ms: 5000,
  graded: true,
}
const JS: CodeBlock = {
  ...PYTHON,
  id: "e2e-code-js",
  language: "javascript",
  instructions: "Print the squares.",
  starter: "for (let i = 1; i <= 3; i++) console.log(i * i)\n",
  solution: "",
  tests: [],
  graded: false,
}
const SQL: CodeBlock = {
  ...JS,
  id: "e2e-code-sql",
  language: "sql",
  instructions: "Sum the column.",
  starter: "CREATE TABLE t(x INTEGER);\nINSERT INTO t VALUES (1), (2), (4);\nSELECT sum(x) AS total FROM t;\n",
}
const BLOCKS = [PYTHON, JS, SQL]
// The server assigns its own ids to new blocks and tests, so ours are recognised by their instructions.
const isOurs = (block: { type: string; instructions?: string }) =>
  block.type === "code" && BLOCKS.some((ours) => ours.instructions === block.instructions)

async function publish(page: Page, courseId: string, note: string) {
  const pending = await api<PendingChanges>(page, "GET", `/v1/lms/courses/${courseId}/pending`)
  // A draft identical to the live version has nothing to publish (422 lms/nothing-to-publish).
  if (pending.draft_seq === null || pending.draft_seq === undefined) return
  await api(page, "POST", `/v1/lms/courses/${courseId}/publish`, { draft_seq: pending.draft_seq, note }).catch(
    (error: Error) => {
      if (!error.message.includes("nothing-to-publish")) throw error
    },
  )
}

async function shoot(page: Page, name: string) {
  const width = page.viewportSize()?.width ?? 0
  await page.screenshot({ path: `${SHOTS}/code-${name}-${width}.png`, fullPage: true })
}

/** A page in its own context (own session) with the project's device, tracked for `api` calls. */
async function openPage(browser: Browser): Promise<Page> {
  const { viewport, isMobile, hasTouch, deviceScaleFactor, userAgent, locale } = test.info().project.use
  const page = await browser.newPage({ viewport, isMobile, hasTouch, deviceScaleFactor, userAgent, locale })
  trackToken(page)
  return page
}

test("LMS code blocks: run Python, JavaScript and SQL, submit with hidden tests, run the solution", async ({
  browser,
}) => {
  test.setTimeout(300_000)
  const teacher = await openPage(browser)
  await loginAs(teacher, TEACHER, "lms", { path: "/my/" })
  const mine = await api<MyCourses>(teacher, "GET", "/v1/lms/my-courses")
  const course = mine.managed.find((item) => item.title === COURSE_TITLE) ?? mine.managed[0]
  test.skip(!course, "the teacher manages no course (run seed-demo)")
  if (!course) return
  const draft = await api<CourseDraft>(teacher, "GET", `/v1/lms/courses/${course.id}/draft`)
  const stepId = draft.outline.flatMap((section) => section.steps)[0]?.step_id
  if (!stepId) throw new Error("the demo course has no steps")

  const original = await api<StepDraft>(teacher, "GET", `/v1/lms/steps/${stepId}/draft`)
  const clean = original.content.blocks.filter((block) => !isOurs(block))
  await api(teacher, "PUT", `/v1/lms/steps/${stepId}/draft`, {
    content: { ...original.content, blocks: [...clean, ...BLOCKS] },
    lock_version: original.lock_version,
  })
  const saved = await api<StepDraft>(teacher, "GET", `/v1/lms/steps/${stepId}/draft`)
  for (const ours of BLOCKS) {
    const stored = saved.content.blocks.find(
      (block) => block.type === "code" && block.instructions === ours.instructions,
    )
    if (stored?.type !== "code") throw new Error(`block not saved: ${ours.language}`)
    ours.id = stored.id
    ours.tests.forEach((test, index) => (test.id = stored.tests[index]?.id ?? test.id))
  }
  await publish(teacher, course.id, "e2e code blocks")

  try {
    // Student: run each language, then submit the graded Python block.
    const student = await openPage(browser)
    await loginAs(student, STUDENT, "lms", { path: "/my/" })
    await api(student, "POST", `/v1/lms/courses/${course.id}/enroll`).catch(() => null)
    // The player shows one block at a time; ours follow the step's own blocks (`?block=` is 1-based).
    const blockUrl = (block: CodeBlock) =>
      `${URLS.lms}/course/${course.id}/step/${stepId}/?block=${clean.length + BLOCKS.indexOf(block) + 1}`
    await student.goto(blockUrl(PYTHON))

    const py = student.locator(`[data-block-id="${PYTHON.id}"]`)
    await py.scrollIntoViewIfNeeded()
    await expect(py.locator("[data-code-editor]")).toBeVisible()
    await py.locator('[data-code-action="run"]').click()
    await expect(py.locator("[data-code-output]")).toContainText("-1", { timeout: 120_000 })
    await py.locator('[data-code-tab="tests"]').click()
    const [visible, secret] = PYTHON.tests.map((item) => py.locator(`[data-test-id="${item.id}"]`))
    await expect(visible!).toHaveAttribute("data-status", "failed")
    await expect(secret!).not.toContainText("add(-4")
    await shoot(student, "learner-failing")

    // Fix the code in the editor, then submit: the hidden test is fetched and the score saved.
    const content = py.locator(".cm-content")
    await content.click()
    await student.keyboard.press("ControlOrMeta+a")
    await student.keyboard.type("def add(a, b):\n    return a + b\n")
    const hidden = student.waitForResponse((r) => r.url().endsWith(`/blocks/${PYTHON.id}/hidden-tests`))
    const saved = student.waitForResponse((r) => r.url().endsWith(`/blocks/${PYTHON.id}/result`))
    await py.locator('[data-code-action="submit"]').click()
    expect((await hidden).status()).toBe(200)
    expect((await saved).status()).toBe(200)
    await expect(py.locator("[data-code-score]")).toHaveAttribute("data-code-score", "100")
    await expect(secret!).toHaveAttribute("data-status", "passed")
    await shoot(student, "learner-submitted")

    const view = await api<{ blocks: { id: string; result?: { score: number } | null }[] }>(
      student,
      "GET",
      `/v1/lms/courses/${course.id}/steps/${stepId}`,
    )
    const stored = view.blocks.find((block) => block.id === PYTHON.id)
    expect(stored?.result?.score).toBe(100)
    expect(JSON.stringify(view)).not.toContain("add(-4, 1)")

    for (const [block, expected] of [
      [JS, "9"],
      [SQL, "7"],
    ] as const) {
      await student.goto(blockUrl(block))
      const panel = student.locator(`[data-block-id="${block.id}"]`)
      await panel.locator('[data-code-action="run"]').click()
      await expect(panel.locator("[data-code-output]")).toContainText(expected, { timeout: 60_000 })
      await shoot(student, `learner-${block.language}`)
    }
    await student.close()

    // Author: run the solution against every test, hidden included.
    await teacher.goto(`${URLS.lms}/edit/step/?id=${stepId}`)
    const editor = teacher.locator(`[data-block-id="${PYTHON.id}"]`)
    await editor.scrollIntoViewIfNeeded()
    await editor.locator('[data-code-action="run-solution"]').click()
    await expect(editor.locator("[data-solution-score]")).toHaveAttribute("data-solution-score", "100", {
      timeout: 120_000,
    })
    await shoot(teacher, "author")
  } finally {
    const current = await api<StepDraft>(teacher, "GET", `/v1/lms/steps/${stepId}/draft`)
    await api(teacher, "PUT", `/v1/lms/steps/${stepId}/draft`, {
      content: { ...current.content, blocks: current.content.blocks.filter((block) => !isOurs(block)) },
      lock_version: current.lock_version,
    })
    await publish(teacher, course.id, "e2e code blocks restore")
    await teacher.close()
  }
})
