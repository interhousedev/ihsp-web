/** LMS access rules: the lock on a lesson, the contact and the settings tab. */
import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { apiUrl, coursePageLocked, ids, problem, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
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
    expect(await screen.findByRole("tab", { name: /access|доступ|kirish/i })).toBeTruthy()
  })
})
