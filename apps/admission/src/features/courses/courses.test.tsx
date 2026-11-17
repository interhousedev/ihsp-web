import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { CoursesPage } from "./components/courses-page"

const base = { source_ref: null, provider: null, level: null, year: null, grade: null, included: true }

const noOpportunities = () =>
  server.use(
    http.get(apiUrl("/v1/admission/opportunities"), () =>
      HttpResponse.json({ items: [], total: 0, page: 1, size: 200 }),
    ),
  )

describe("courses page", () => {
  test("groups courses by source and explains an empty source", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/courses"), () =>
        HttpResponse.json({
          items: [
            { ...base, id: "a1", source: "academic", title: "Algebra" },
            { ...base, id: "m1", source: "manual", title: "Summer school" },
          ],
        }),
      ),
    )
    noOpportunities()
    renderAdmissionApp(<CoursesPage />)
    expect(await screen.findByText("Algebra")).toBeTruthy()
    expect(screen.getByText("Summer school")).toBeTruthy()
    expect(screen.getByText("You are not enrolled in any LMS course yet.")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Add a course" })).toBeTruthy()
  })

  test("adds an LMS course in one click", async () => {
    let hit = false
    noOpportunities()
    server.use(
      http.get(apiUrl("/v1/admission/courses"), () =>
        HttpResponse.json({
          items: [{ ...base, id: null, source: "lms", source_ref: "lms1", title: "Python", included: false }],
        }),
      ),
      http.post(apiUrl("/v1/admission/courses/lms/lms1"), () => {
        hit = true
        return HttpResponse.json(
          { ...base, id: "n1", source: "lms", source_ref: "lms1", title: "Python" },
          { status: 201 },
        )
      }),
    )
    renderAdmissionApp(<CoursesPage />)
    fireEvent.click(await screen.findByRole("button", { name: "Add" }))
    await waitFor(() => expect(hit).toBe(true))
  })

  test("finds an LMS course in the catalog, enrols and adds it", async () => {
    const calls: string[] = []
    noOpportunities()
    server.use(
      http.get(apiUrl("/v1/admission/courses"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/lms/courses"), () =>
        HttpResponse.json([{ id: "c1", title: "Intro to Python", summary: "Basics", cover_url: null, locked: false }]),
      ),
      http.post(apiUrl("/v1/lms/courses/c1/enroll"), () => {
        calls.push("enroll")
        return HttpResponse.json({})
      }),
      http.post(apiUrl("/v1/admission/courses/lms/c1"), () => {
        calls.push("add")
        return HttpResponse.json(
          { ...base, id: "n1", source: "lms", source_ref: "c1", title: "Intro to Python" },
          { status: 201 },
        )
      }),
    )
    renderAdmissionApp(<CoursesPage />)
    fireEvent.click(await screen.findByRole("button", { name: "Find an LMS course" }))
    expect(await screen.findByText("Intro to Python")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Add" }))
    await waitFor(() => expect(calls).toEqual(["enroll", "add"]))
  })

  test("adding an excluded LMS course includes it again", async () => {
    let patched: unknown = null
    noOpportunities()
    server.use(
      http.get(apiUrl("/v1/admission/courses"), () =>
        HttpResponse.json({
          items: [{ ...base, id: "n1", source: "lms", source_ref: "lms1", title: "Python", included: false }],
        }),
      ),
      http.post(apiUrl("/v1/admission/courses/lms/lms1"), () =>
        HttpResponse.json({ ...base, id: "n1", source: "lms", source_ref: "lms1", title: "Python", included: false }),
      ),
      http.patch(apiUrl("/v1/admission/courses/n1"), async ({ request }) => {
        patched = await request.json()
        return HttpResponse.json({ ...base, id: "n1", source: "lms", source_ref: "lms1", title: "Python" })
      }),
    )
    renderAdmissionApp(<CoursesPage />)
    fireEvent.click(await screen.findByRole("button", { name: "Add" }))
    await waitFor(() => expect(patched).toEqual({ included: true }))
  })
})
