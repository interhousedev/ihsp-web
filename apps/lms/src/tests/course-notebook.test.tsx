import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { apiUrl, coursePage, coursePageNotEnrolled, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { CoursePage } from "../features/courses/components/course-page"
import { CourseNotebooksPage } from "../features/notebooks/components/course-notebooks-page"
import { renderLms } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

function notebook(id: string, origin: string, title: string) {
  return {
    id,
    title,
    emoji: null,
    pinned: false,
    source_count: 3,
    last_opened_at: null,
    updated_at: "2026-10-01T10:00:00Z",
    origin,
    subject_id: null,
    lesson_id: null,
    course_id: coursePage.id,
    can_write: true,
  }
}

describe("course notebook button", () => {
  it("opens the student's notebook of an enrolled course", async () => {
    let posted = 0
    server.use(
      http.post(apiUrl(`/v1/notebooks/course/${coursePage.id}`), () => {
        posted += 1
        return HttpResponse.json(notebook("nb-course-1", "course_student", coursePage.title))
      }),
    )
    const { user } = renderLms(<CoursePage slug={coursePage.slug} />)

    await user.click(await screen.findByRole("button", { name: "Course notebook" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith("/notebooks/view/?id=nb-course-1"))
    expect(posted).toBe(1)
  })

  it("is not offered to someone who is not enrolled", async () => {
    server.use(http.get(apiUrl("/v1/lms/courses/:slug"), () => HttpResponse.json(coursePageNotEnrolled)))
    renderLms(<CoursePage slug={coursePageNotEnrolled.slug} />)

    expect(await screen.findByRole("heading", { level: 1, name: coursePageNotEnrolled.title })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Course notebook" })).not.toBeInTheDocument()
  })
})

describe("notebooks page", () => {
  it("lists the course notebooks and leaves the student's own notebooks out", async () => {
    server.use(
      http.get(apiUrl("/v1/notebooks"), () =>
        HttpResponse.json({
          items: [
            notebook("nb-course-1", "course_student", "Derivatives 101"),
            notebook("nb-own", "manual", "My notes"),
          ],
          next_cursor: null,
        }),
      ),
    )
    renderLms(<CourseNotebooksPage />)

    const link = await screen.findByRole("link", { name: /Derivatives 101/ })
    // The test router normalises the trailing slash of the static route; the query names the notebook.
    expect(link.getAttribute("href")).toMatch(/^\/notebooks\/view\/?\?id=nb-course-1$/)
    expect(screen.queryByText("My notes")).toBeNull()
  })
})
