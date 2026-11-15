/** LMS access rules: the lock on a lesson, the contact and the settings tab. */
import { describe, expect, it, setDefaultTimeout, spyOn } from "bun:test"
import { apiUrl, coursePageLocked, ids, problem, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { AccessRuleForm } from "../features/access/components/access-rule-form"
import { LessonAccessDialog } from "../features/access/components/lesson-access-dialog"
import { CourseOutline } from "../features/courses/components/course-outline"
import { StepPlayer } from "../features/player/components/step-player"
import { CourseSettingsPage } from "../features/settings/components/settings-page"
import { authorSession, renderLms } from "./helpers"

setDefaultTimeout(60_000)

describe("locked lesson", () => {
  it("shows the lock and the course lead when the backend answers content-locked", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:courseId/steps/:stepId"), () => problem(403, "lms/content-locked", "Locked")),
      http.get(apiUrl("/v1/lms/courses/:slug"), () => HttpResponse.json(coursePageLocked)),
    )
    renderLms(<StepPlayer courseId={ids.course} stepId={ids.courseStepText} slug="derivatives-101" mode="learn" />, {
      route: `/course/${ids.course}/step/${ids.courseStepText}/`,
    })
    await waitFor(() => expect(screen.getAllByRole("status").length).toBeGreaterThan(0))
    expect(await screen.findByText(/Aziza Karimova/)).toBeTruthy()
    expect(screen.getByRole("link", { name: /aziza_k/ }).getAttribute("href")).toBe("https://t.me/aziza_k")
  })
})

describe("access tab", () => {
  it("lists the audiences on the course settings", async () => {
    renderLms(<CourseSettingsPage courseId={ids.course} pollMs={20} />, { session: authorSession })
    expect(await screen.findByRole("tab", { name: "Who can see" })).toBeTruthy()
    expect(screen.getByRole("tab", { name: "Visibility" })).toBeTruthy()
  })
})

describe("locked lesson in the syllabus", () => {
  it("shows the lock icon with its label next to the lesson", () => {
    renderLms(<CourseOutline page={coursePageLocked} linkSteps={false} />)
    expect(screen.getAllByRole("img", { name: "Locked" }).length).toBe(
      coursePageLocked.outline.reduce((sum, section) => sum + section.steps.length, 0),
    )
  })
})

describe("access form", () => {
  it("keeps Save disabled for chosen people with nobody chosen", async () => {
    const rule = {
      audience: "public" as const,
      when_denied: "hidden" as const,
      group_ids: [],
      users: [],
    }
    const { user } = renderLms(
      <AccessRuleForm
        courseId={ids.course}
        rule={rule}
        readOnly={false}
        pending={false}
        error={null}
        idPrefix="t"
        onSave={() => undefined}
      />,
    )
    const save = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement
    expect(save.disabled).toBe(true)
    await user.click(screen.getByRole("radio", { name: "Signed-in users" }))
    expect(save.disabled).toBe(false)
    await user.click(screen.getByRole("radio", { name: "Chosen groups and people" }))
    expect(save.disabled).toBe(true)
  })

  it("says Access saved after saving", async () => {
    const success = spyOn(toast, "success").mockImplementation(() => "")
    const { user } = renderLms(
      <LessonAccessDialog
        courseId={ids.course}
        stepId={ids.courseStepText}
        title="Intro"
        canManage
        open
        onOpenChange={() => undefined}
      />,
      { session: authorSession },
    )
    await user.click(await screen.findByRole("radio", { name: "Signed-in users" }))
    await user.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(success).toHaveBeenCalledWith("Access saved"))
    success.mockRestore()
  })
})
