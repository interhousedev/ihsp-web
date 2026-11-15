import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { apiUrl, coursePage, courseCards, problem, server, stepViews } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import Page from "../app/page"
import { CourseRoute } from "../features/courses/components/course-route"
import { renderLms } from "./helpers"

setDefaultTimeout(60_000)

/** No platform session: the silent sign-in finds nothing and the visitor stays a guest. */
function asGuest() {
  const personal: string[] = []
  server.use(
    http.post(apiUrl("/v1/oauth/refresh"), () => problem(401, "auth/unauthorized", "No session")),
    http.get(apiUrl("/v1/lms/courses"), () => {
      personal.push("courses")
      return problem(401, "auth/unauthorized", "Sign in")
    }),
    http.get(apiUrl("/v1/lms/my-courses"), () => {
      personal.push("my-courses")
      return HttpResponse.json({ enrolled: [], managed: [] })
    }),
  )
  return personal
}

describe("the LMS for a guest", () => {
  it("shows the catalogue from the public endpoint with a sign-in button", async () => {
    const personal = asGuest()
    renderLms(<Page />, { session: null })

    expect(await screen.findByText(courseCards[0]!.title)).toBeInTheDocument()
    expect((await screen.findAllByRole("button", { name: "Sign in" })).length).toBeGreaterThan(0)
    expect(personal).toEqual([])
  })

  it("shows a course page with a sign-in call to action instead of Join", async () => {
    asGuest()
    renderLms(<CourseRoute />, { session: null, route: `/course/${coursePage.slug}/` })

    expect(
      await screen.findByText("Sign in to join the course, take tests and keep your progress."),
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Join course" })).not.toBeInTheDocument()
  })

  it("opens a text lesson without a token", async () => {
    asGuest()
    const step = stepViews.find((item) => item.blocks.some((block) => block.type === "text"))!
    renderLms(<CourseRoute />, { session: null, route: `/course/${coursePage.id}/step/${step.step_id}/` })

    expect((await screen.findAllByText(step.title)).length).toBeGreaterThan(0)
  })
})
