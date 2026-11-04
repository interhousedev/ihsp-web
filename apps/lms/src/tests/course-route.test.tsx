import { afterEach, describe, expect, it, setDefaultTimeout } from "bun:test"
import { readFileSync } from "node:fs"
import { apiUrl, coursePage, ids, server, stepViewTest } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { CourseRoute } from "../features/courses/components/course-route"
import { StepPlayer } from "../features/player/components/step-player"
import { resolveCourseUrl } from "../features/shared/utils/course-path"
import { hrefs } from "../features/shared/utils/hrefs"
import { renderLms } from "./helpers"

setDefaultTimeout(60_000)

function at(url: string) {
  window.history.replaceState(null, "", url)
}

afterEach(() => at("/"))

describe("course addresses", () => {
  it("keep the ids in the path", () => {
    expect(hrefs.step("c1", "s1")).toBe("/course/c1/step/s1/")
    expect(hrefs.step("c1", "s1", 3)).toBe("/course/c1/step/s1/?block=3")
    expect(hrefs.course("algebra")).toBe("/course/algebra/")
    expect(hrefs.course("algebra", true)).toBe("/course/algebra/?preview=1")
  })

  it("resolve the path forms", () => {
    expect(resolveCourseUrl("/course/c1/step/s1/", "?block=2")).toEqual({
      kind: "player",
      courseId: "c1",
      stepId: "s1",
      block: 2,
    })
    expect(resolveCourseUrl("/course/algebra/", "")).toEqual({ kind: "entry", ref: "algebra", preview: false })
    expect(resolveCourseUrl("/course/algebra/", "?preview=1")).toEqual({ kind: "entry", ref: "algebra", preview: true })
  })

  it("redirect the old query links, keeping the block and the tab", () => {
    expect(resolveCourseUrl("/course/step/", "?course=c1&step=s1&slug=x&block=2")).toEqual({
      kind: "redirect",
      href: "/course/c1/step/s1/?block=2",
    })
    expect(resolveCourseUrl("/course/", "?slug=algebra&tab=notebook")).toEqual({
      kind: "redirect",
      href: "/course/algebra/?tab=notebook",
    })
    expect(resolveCourseUrl("/course/about/", "?slug=algebra&preview=1")).toEqual({
      kind: "redirect",
      href: "/course/algebra/?preview=1",
    })
    expect(resolveCourseUrl("/course/", "")).toEqual({ kind: "missing" })
  })

  it("does not loop on a slug that is also a folder of the app", () => {
    expect(hrefs.course("step")).toBe("/course/?slug=step")
    expect(resolveCourseUrl("/course/", "?slug=step")).toEqual({ kind: "entry", ref: "step", preview: false })
  })
})

describe("deployment", () => {
  const conf = readFileSync(new URL("../../../../deploy/sites/lms.conf", import.meta.url), "utf8")

  it("nginx serves the shell for ids in the path, and real folders first", () => {
    const match = conf.match(
      /location ~ (\^\/course\/\S+) \{\s*try_files \$uri\/index\.html \/course\/shell\/index\.html;/,
    )
    expect(match).not.toBeNull()
    const pattern = new RegExp(match?.[1] ?? "$^")
    expect(pattern.test("/course/c1/")).toBe(true)
    expect(pattern.test("/course/c1/step/s1/")).toBe(true)
    expect(pattern.test("/course/c1/step/s1")).toBe(true)
    expect(pattern.test("/course/")).toBe(false)
    expect(pattern.test("/course/c1/other/s1/")).toBe(false)
  })
})

describe("course route", () => {
  it("opens an enrolled course at the step to continue", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:ref"), () =>
        HttpResponse.json({
          ...coursePage,
          enrolled: true,
          outline: [
            {
              id: "m1",
              title: "Module",
              steps: [
                { step_id: "done", title: "Done", completed: true },
                { step_id: "next", title: "Next", completed: false },
              ],
            },
          ],
        }),
      ),
    )
    renderLms(<CourseRoute />, { route: `/course/${coursePage.slug}/` })
    await waitFor(() => expect(window.location.pathname).toBe(`/course/${coursePage.id}/step/next/`))
  })

  it("moves between steps without leaving the page", async () => {
    renderLms(<CourseRoute />, { route: `/course/${ids.course}/step/${ids.courseStepTest}/` })
    const link = await screen.findByRole("link", { name: /What is a derivative\?/ })
    link.click()
    await waitFor(() =>
      expect(window.location.pathname).toMatch(new RegExp(`^/course/${ids.course}/step/(?!${ids.courseStepTest})`)),
    )
  })
})

describe("the unified page", () => {
  function renderPlayer() {
    return renderLms(<StepPlayer courseId={ids.course} stepId={ids.courseStepTest} slug={null} mode="learn" />)
  }

  it("goes back to the list of courses", async () => {
    renderPlayer()
    const back = await screen.findByRole("link", { name: "My courses" })
    expect(back.getAttribute("href")).toMatch(/^\/my\/?$/)
  })

  it("has the sections of the course page", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:courseId/steps/:stepId"), () => HttpResponse.json(stepViewTest)),
      http.get(apiUrl("/v1/lms/courses/:ref"), () => HttpResponse.json({ ...coursePage, enrolled: true })),
    )
    const { user } = renderPlayer()
    for (const name of [
      "Lesson",
      "About",
      "Syllabus",
      "Staff",
      "Progress and points",
      "Updates",
      "Notebook",
      "AI chat",
    ])
      expect(await screen.findByRole("tab", { name })).toBeInTheDocument()
    await user.click(screen.getByRole("tab", { name: "Syllabus" }))
    expect(await screen.findByRole("tab", { name: "Syllabus", selected: true })).toBeInTheDocument()
  })

  it("keeps the staff controls reachable from About", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:ref"), () =>
        HttpResponse.json({ ...coursePage, enrolled: true, can_edit: true }),
      ),
    )
    const { user } = renderPlayer()
    await user.click(await screen.findByRole("tab", { name: "About" }))
    const edit = await screen.findByRole("link", { name: "Edit" })
    expect(edit.getAttribute("href")).toContain(`id=${coursePage.id}`)
  })
})
