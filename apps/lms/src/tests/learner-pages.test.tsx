import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { apiUrl, coursePage, coursePageNotEnrolled, ids, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { CatalogPage } from "../features/catalog/components/catalog-page"
import { CoursePage } from "../features/courses/components/course-page"
import { JoinPage } from "../features/courses/components/join-page"
import { MyCoursesPage } from "../features/courses/components/my-courses-page"
import { readBody, renderLms } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

describe("catalog", () => {
  it("lists courses and filters by the search text", async () => {
    const { user } = renderLms(<CatalogPage />)
    expect(await screen.findByText("Derivatives 101")).toBeInTheDocument()
    expect(screen.getByText("Linear algebra intro")).toBeInTheDocument()
    expect(screen.getByText("3 lessons")).toBeInTheDocument()
    await user.click(screen.getByLabelText("Search courses"))
    await user.paste("linear")
    // The machine can be busy with other builds, so this one waits longer than the default.
    await waitFor(() => expect(screen.queryByText("Derivatives 101")).not.toBeInTheDocument(), { timeout: 30_000 })
    expect(screen.getByText("Linear algebra intro")).toBeInTheDocument()
  })

  it("says so when nothing matches", async () => {
    const { user } = renderLms(<CatalogPage />)
    await user.click(await screen.findByLabelText("Search courses"))
    await user.paste("zzzz")
    expect(await screen.findByText("No courses match your search.")).toBeInTheDocument()
  })
})

describe("my courses", () => {
  it("separates studying from managing and shows the progress", async () => {
    renderLms(<MyCoursesPage />)
    const studying = (await screen.findByRole("heading", { name: "Studying" })).closest("section") as HTMLElement
    expect(within(studying).getByText("Derivatives 101")).toBeInTheDocument()
    expect(within(studying).getByText("33%")).toBeInTheDocument()
    const managing = screen.getByRole("heading", { name: "Managing" }).closest("section") as HTMLElement
    expect(within(managing).getAllByRole("link", { name: "Edit" })[0]?.getAttribute("href")).toContain(`/edit`)
  })
})

describe("course page", () => {
  it("shows staff with their roles, the outline marks, progress and the Updated note", async () => {
    renderLms(<CoursePage slug={coursePage.slug} />, { route: `/course/?slug=${coursePage.slug}` })
    expect(await screen.findByRole("heading", { name: "Derivatives 101", level: 1 })).toBeInTheDocument()
    expect(screen.getByText("Rakhimov Timur")).toBeInTheDocument()
    expect(screen.getByText("Author")).toBeInTheDocument()
    // The hidden staff member ("show on page" off) is not part of the page the server sends.
    expect(screen.queryByText("Tester")).not.toBeInTheDocument()
    expect(screen.getByText("Changed")).toBeInTheDocument()
    expect(screen.getByText("New")).toBeInTheDocument()
    expect(screen.getByLabelText("Progress")).toBeInTheDocument()
    expect(screen.getByText("2 of 3 points")).toBeInTheDocument()
    expect(
      screen.getByText(/2 lessons are new or changed; your completed lessons stay completed\./),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Completed")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: /Derivative rules quiz/ })
    expect(link.getAttribute("href")).toContain(`course=${ids.course}&step=${ids.courseStepTest}`)
    // Continue goes to the first step that is not completed.
    expect(screen.getByRole("link", { name: "Continue" }).getAttribute("href")).toContain(`step=${ids.courseStepTest}`)
  })

  it("numbers the modules and lessons of the syllabus and sizes the course in the side card", async () => {
    renderLms(<CoursePage slug={coursePage.slug} />)
    const syllabus = (await screen.findByRole("heading", { name: "Syllabus" })).closest("section") as HTMLElement
    const modules = within(syllabus).getAllByRole("heading", { level: 3 })
    expect(modules.map((item) => item.textContent)).toEqual(["1Introduction", "2Rules and practice"])
    expect(within(syllabus).getByText("1.1")).toBeInTheDocument()
    expect(within(syllabus).getByText("2.1")).toBeInTheDocument()
    expect(within(syllabus).getByText("2.2")).toBeInTheDocument()
    expect(within(syllabus).getByText("2 lessons")).toBeInTheDocument()
    const facts = screen.getByRole("list", { name: "Course facts" })
    expect(within(facts).getByText("3 lessons")).toBeInTheDocument()
    expect(within(facts).getByText("3 points")).toBeInTheDocument()
  })

  it("shows the Join course button of the promo page to someone who is not enrolled", async () => {
    server.use(http.get(apiUrl("/v1/lms/courses/:slug"), () => HttpResponse.json(coursePageNotEnrolled)))
    renderLms(<CoursePage slug={coursePage.slug} />)
    expect(await screen.findByRole("button", { name: "Join course" })).toBeInTheDocument()
    expect(screen.queryByLabelText("Progress")).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Continue" })).not.toBeInTheDocument()
  })

  it("enrolls in a public course and then offers Continue", async () => {
    let enrolled = false
    server.use(
      http.get(apiUrl("/v1/lms/courses/:slug"), () => HttpResponse.json(coursePageNotEnrolled)),
      http.post(apiUrl("/v1/lms/courses/:id/enroll"), () => {
        enrolled = true
        return HttpResponse.json({ ...coursePage, progress_pct: 0, changed_since_last_visit: [] })
      }),
    )
    const { user } = renderLms(<CoursePage slug={coursePage.slug} />)
    // Steps are not links before enrolling.
    expect(await screen.findByText("Derivative rules quiz")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Derivative rules quiz/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Join course" }))
    await waitFor(() => expect(enrolled).toBe(true))
    expect(await screen.findByRole("link", { name: "Continue" })).toBeInTheDocument()
  })

  it("sends people to the code form for an invite-only course", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:slug"), () =>
        HttpResponse.json({ ...coursePageNotEnrolled, visibility: "invite" }),
      ),
    )
    renderLms(<CoursePage slug={coursePage.slug} />)
    expect(await screen.findByRole("link", { name: "Enter invite code" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Join course" })).not.toBeInTheDocument()
  })

  it("shows Edit and Preview draft to staff", async () => {
    server.use(http.get(apiUrl("/v1/lms/courses/:slug"), () => HttpResponse.json({ ...coursePage, can_edit: true })))
    renderLms(<CoursePage slug={coursePage.slug} />)
    expect(await screen.findByRole("link", { name: "Edit" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Preview draft" })).toBeInTheDocument()
  })
})

describe("join page", () => {
  it("pre-fills the code from the link but waits for the button", async () => {
    let joined: unknown = null
    server.use(
      http.post(apiUrl("/v1/lms/join"), async ({ request }) => {
        joined = await readBody(request)
        return HttpResponse.json({ ...coursePage, enrolled: true })
      }),
    )
    const { user } = renderLms(<JoinPage />, { route: "/join/?code=KP7M2Q" })
    const field = await screen.findByLabelText("Invite code")
    expect(field).toHaveValue("KP7M2Q")
    expect(joined).toBeNull()
    await user.click(screen.getByRole("button", { name: "Join" }))
    await waitFor(() => expect(joined).toEqual({ code: "KP7M2Q" }))
    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith(`/course/?slug=${coursePage.slug}`))
  })

  it("says the invite is not valid for a wrong or rotated code", async () => {
    const { user } = renderLms(<JoinPage />, { route: "/join/?code=BADCODE" })
    await user.click(await screen.findByRole("button", { name: "Join" }))
    expect(await screen.findByText("Invite not valid. Check the code or ask for a new one.")).toBeInTheDocument()
    expect(testRouter.push).not.toHaveBeenCalled()
  })

  it("keeps Join disabled until a code is entered", async () => {
    renderLms(<JoinPage />, { route: "/join/" })
    expect(await screen.findByRole("button", { name: "Join" })).toBeDisabled()
  })
})
