/** WEB-7, WEB-8, UF-WEB-05: subjects and the subject page. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, ids, server, subjectCards, subjectDetailPhysics } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { SubjectPage } from "../features/subjects/components/subject-page"
import { SubjectsPage } from "../features/subjects/components/subjects-page"
import { configureTests, freezeTime, renderSp, setValue, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

const PHYSICS = `/subjects/view/?id=${ids.physics}&semester=4`

describe("subjects page", () => {
  test("one card per subject with teachers, semester mark, EMIS rating, absences and the next lesson", async () => {
    renderSp(<SubjectsPage />, { route: "/subjects/" })

    await screen.findByText("Chemistry")
    expect(screen.getAllByRole("link")).toHaveLength(subjectCards.length)
    const physics = screen.getByRole("link", { name: /Physics/ })
    expect(within(physics).getByText("4.8")).toBeInTheDocument()
    expect(within(physics).getByText(/Next lesson: /)).toBeInTheDocument()
    expect(physics.getAttribute("href")).toMatch(new RegExp(`^/subjects/view/?\\?id=${ids.physics}$`))
  })

  test("a past semester is requested from the server", async () => {
    const requests: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/me/subjects"), ({ request }) => {
        requests.push(new URL(request.url).searchParams.get("semester"))
        return HttpResponse.json(subjectCards)
      }),
    )
    renderSp(<SubjectsPage />, { route: "/subjects/?semester=3" })

    await screen.findByText("Physics")

    expect(requests).toEqual(["3"])
  })

  test("an empty semester has its own message", async () => {
    server.use(http.get(apiUrl("/v1/me/subjects"), () => HttpResponse.json([])))
    renderSp(<SubjectsPage />, { route: "/subjects/" })

    expect(await screen.findByText("No subjects in this semester.")).toBeInTheDocument()
  })
})

describe("subject page", () => {
  test("Overview shows teachers, semester mark, EMIS rating, absence rate and the three averages", async () => {
    renderSp(<SubjectPage />, { route: PHYSICS })

    expect(await screen.findByRole("heading", { name: "Physics" })).toBeInTheDocument()
    expect(screen.getByText("Semester 4")).toBeInTheDocument()
    expect(screen.getByText("Kalandarova Gavxar")).toBeInTheDocument()
    expect(screen.getByText("4.8")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()
    expect(screen.getByText("Averages")).toBeInTheDocument()
  })

  test("Lessons lists the lessons newest first with topic, attendance and homework", async () => {
    renderSp(<SubjectPage />, { route: `${PHYSICS}&tab=lessons` })

    const links = await screen.findAllByRole("link", { name: /Physics|topic|No topic/ })
    const dates = links.map((link) => link.textContent ?? "")

    expect(dates.length).toBe(subjectDetailPhysics.lessons.length)
    expect(screen.getByText("Solve problems 14-17 on page 52")).toBeInTheDocument()
    expect(screen.getAllByText("Not taken yet").length).toBeGreaterThan(0)
  })

  test("Marks can be filtered by type", async () => {
    const { user } = renderSp(<SubjectPage />, { route: `${PHYSICS}&tab=marks` })

    const all = await screen.findAllByRole("listitem")
    expect(all).toHaveLength(subjectDetailPhysics.marks.length)
    await user.click(screen.getByRole("button", { name: "Midterm" }))

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1))
  })

  test("Materials can be searched by name", async () => {
    renderSp(<SubjectPage />, { route: `${PHYSICS}&tab=materials` })

    await screen.findByText("Khan Academy: physics")
    setValue(screen.getByLabelText("Search materials"), "kinematics")

    await waitFor(() => expect(screen.queryByText("Khan Academy: physics")).not.toBeInTheDocument())
    expect(screen.getByText("kinematics-notes.pdf")).toBeInTheDocument()
    setValue(screen.getByLabelText("Search materials"), "zzz")
    expect(await screen.findByText("No materials found.")).toBeInTheDocument()
  })

  test("an unknown subject shows the error state", async () => {
    renderSp(<SubjectPage />, { route: "/subjects/view/?id=00000000-0000-0000-0000-000000000000" })

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  test("without an id it says the subject was not found", () => {
    renderSp(<SubjectPage />, { route: "/subjects/view/" })

    expect(screen.getByText("Subject not found.")).toBeInTheDocument()
  })
})
