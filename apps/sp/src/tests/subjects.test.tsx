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
  test("Overview is the default tab and shows teachers, semester mark, EMIS rating, absence rate and averages", async () => {
    renderSp(<SubjectPage />, { route: PHYSICS })

    expect(await screen.findByRole("heading", { name: "Physics" })).toBeInTheDocument()
    expect(screen.getByText("Semester 4")).toBeInTheDocument()
    expect(screen.getByText("Kalandarova Gavxar")).toBeInTheDocument()
    expect(screen.getByText("4.8")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()
    expect(screen.getByText("Averages")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Overview", selected: true })).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: "Marks" })).not.toBeInTheDocument()
  })

  test("Overview has the planner and notebook buttons", async () => {
    renderSp(<SubjectPage />, { route: PHYSICS })

    const planner = await screen.findByRole("link", { name: "Mark planner" })
    expect(planner.getAttribute("href")).toBe(`/grades/plan?subject=${ids.physics}&semester=4`)
    expect(screen.getByRole("button", { name: "Open notebook" })).toBeInTheDocument()
  })

  test("Lessons list past and upcoming lessons around now with their topic", async () => {
    renderSp(<SubjectPage />, { route: `${PHYSICS}&tab=lessons` })

    expect(await screen.findByRole("region", { name: "Recent lessons" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Next 14 days" })).toBeInTheDocument()
    expect(screen.getAllByText(/topic of/).length).toBeGreaterThan(0)
  })

  test("a lesson shows its marks with type, late in dark orange and absent in dark red", async () => {
    const row = (n: number, attendance: "present" | "late" | "absent") => ({
      lesson_id: `0000000${n}-0000-4000-8000-000000000001`,
      date: `2026-10-0${n}`,
      starts_at: `2026-10-0${n}T09:00:00Z`,
      kind: "lecture",
      topic: `Row ${n}`,
      mark: null,
      attendance,
      materials_count: 0,
      past: true,
    })
    server.use(
      http.get(apiUrl(`/v1/me/subjects/${ids.physics}/lessons`), () =>
        HttpResponse.json({ items: [row(1, "present"), row(2, "late"), row(3, "absent")], has_more_past: false }),
      ),
      http.get(apiUrl(`/v1/me/subjects/${ids.physics}`), () =>
        HttpResponse.json({
          ...subjectDetailPhysics,
          marks: [
            { value: 4, type: "lesson", date: "2026-10-02", lesson_id: "00000002-0000-4000-8000-000000000001" },
            { value: 5, type: "midterm", date: "2026-10-02", lesson_id: "00000002-0000-4000-8000-000000000001" },
          ],
        }),
      ),
    )
    renderSp(<SubjectPage />, { route: `${PHYSICS}&tab=lessons` })

    const late = (await screen.findByText("Row 2")).closest("li")
    expect(late).toHaveAttribute("data-attendance", "late")
    expect(within(late as HTMLElement).getByText("Late").closest("[data-attendance]")?.className).toContain(
      "text-orange-700",
    )
    expect(within(late as HTMLElement).getByText("Midterm (PC)")).toBeInTheDocument()
    expect(within(late as HTMLElement).getAllByText("Lesson").length).toBeGreaterThan(0)
    const absent = screen.getByText("Row 3").closest("li") as HTMLElement
    expect(absent).toHaveAttribute("data-attendance", "absent")
    expect(within(absent).getByText("Absent").closest("[data-attendance]")?.className).toContain("text-red-800")
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
