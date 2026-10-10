/** WEB-7, WEB-8, UF-WEB-05: subjects and the subject page. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { getMeCurriculumQuery, type SubjectCard } from "@ihsp/api"
import { apiUrl, curriculumView, ids, server, subjectCards } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { SubjectPage } from "../features/subjects/components/subject-page"
import { SubjectsPage } from "../features/subjects/components/subjects-page"
import { curriculumSubjectOf } from "../features/subjects/utils/curriculum-subject"
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

const card = (name: string) => screen.getByRole("link", { name: new RegExp(name) })

describe("subjects page: curriculum", () => {
  test("a card shows the study hours of the semester and the subject type from the curriculum", async () => {
    renderSp(<SubjectsPage />, { route: "/subjects/" })

    await screen.findAllByText("In-depth")
    const physics = within(card("Physics"))
    expect(physics.getByText("Study hours")).toBeInTheDocument()
    expect(physics.getByText("102 h")).toBeInTheDocument()
    expect(physics.getByText("In-depth")).toBeInTheDocument()
    expect(within(card("Mathematics")).getByText("136 h")).toBeInTheDocument()
    expect(within(card("Chemistry")).getByText("General education")).toBeInTheDocument()
    expect(within(card("Informatics")).getByText("Unified")).toBeInTheDocument()
    expect(within(card("English")).getByText("68 h")).toBeInTheDocument()
  })

  test("a subject the curriculum does not list has neither hours nor a badge", async () => {
    renderSp(<SubjectsPage />, { route: "/subjects/" })

    await screen.findByText("Unified")
    const history = within(card("History"))
    expect(history.queryByText("Study hours")).not.toBeInTheDocument()
    expect(history.queryByText(/ h$/)).not.toBeInTheDocument()
    expect(history.queryByText("General education")).not.toBeInTheDocument()
  })

  test("a past semester shows the hours of that semester", async () => {
    renderSp(<SubjectsPage />, { route: "/subjects/?semester=3" })

    await screen.findByText("85 h")
    expect(within(card("Physics")).getByText("85 h")).toBeInTheDocument()
    expect(within(card("Mathematics")).getByText("120 h")).toBeInTheDocument()
    expect(within(card("Chemistry")).queryByText("Study hours")).not.toBeInTheDocument()
  })

  test("the Curriculum section lists the profile, the semesters with the current one, and the exams", async () => {
    renderSp(<SubjectsPage />, { route: "/subjects/" })

    const heading = await screen.findByRole("heading", { name: "Curriculum" })
    const section = within(heading.closest("[data-slot=card]") as HTMLElement)
    expect(section.getByText(/ТН, МТН, БТН 2025-2027/)).toBeInTheDocument()
    expect(section.getByText("Информационные технологии (60610100)")).toBeInTheDocument()
    expect(section.getByText("2–5")).toBeInTheDocument()
    expect(section.getByText("Semester 3")).toBeInTheDocument()
    expect(section.getByText("Semester 4").parentElement).toHaveTextContent("Current")
    expect(section.getByText("Final exam: mathematics")).toBeInTheDocument()
    expect(section.getByText("2 h")).toBeInTheDocument()
    expect(section.queryByRole("table")).not.toBeInTheDocument()
  })

  test("a group without a stored curriculum gets a short message and the subjects stay as they were", async () => {
    server.use(http.get(apiUrl("/v1/me/curriculum"), () => HttpResponse.json(null)))
    renderSp(<SubjectsPage />, { route: "/subjects/" })

    expect(await screen.findByText("The curriculum of your group has not been loaded yet.")).toBeInTheDocument()
    expect(screen.getAllByRole("link")).toHaveLength(subjectCards.length)
    expect(screen.queryByText("Study hours")).not.toBeInTheDocument()
  })

  test("a failing curriculum request does not hide the subjects", async () => {
    server.use(http.get(apiUrl("/v1/me/curriculum"), () => HttpResponse.json({ title: "boom" }, { status: 500 })))
    renderSp(<SubjectsPage />, { route: "/subjects/" })

    await screen.findByText("Chemistry")
    expect(screen.getAllByRole("link")).toHaveLength(subjectCards.length)
    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  test("the stored curriculum is read once and never refreshed on its own", async () => {
    let requests = 0
    server.use(
      http.get(apiUrl("/v1/me/curriculum"), () => {
        requests += 1
        return HttpResponse.json(curriculumView)
      }),
    )
    renderSp(<SubjectsPage />, { route: "/subjects/" })
    await screen.findByText("102 h")
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(requests).toBe(1)
    expect(Object.keys(getMeCurriculumQuery()).toSorted()).toEqual(["queryFn", "queryKey"])
  })
})

describe("curriculumSubjectOf", () => {
  const physics = subjectCards.find((item) => item.subject.id === ids.physics) as SubjectCard
  const unlinked: SubjectCard = {
    ...physics,
    subject: { ...physics.subject, id: "00000000-0000-4000-8000-0000000000ff" },
  }

  test("matches by the academic subject id in the viewed semester, else in the current one", () => {
    expect(curriculumSubjectOf(physics, curriculumView, undefined)?.study_hours).toBe(102)
    expect(curriculumSubjectOf(physics, curriculumView, 3)?.study_hours).toBe(85)
    expect(curriculumSubjectOf(physics, curriculumView, 2)).toBeNull()
    expect(curriculumSubjectOf(physics, null, undefined)).toBeNull()
  })

  test("falls back to the EMIS subject id when the card has one", () => {
    expect(curriculumSubjectOf(unlinked, curriculumView, undefined)).toBeNull()
    const withEmis = { ...unlinked, emis_subject_id: 1002 }
    expect(curriculumSubjectOf(withEmis, curriculumView, undefined)?.study_hours).toBe(102)
    expect(
      curriculumSubjectOf(
        { ...unlinked, emis_subject_id: "1002" } as unknown as SubjectCard,
        curriculumView,
        undefined,
      ),
    ).toBeNull()
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
    const row = (n: number, attendance: "present" | "late" | "absent", marks: { type: string; value: number }[]) => ({
      lesson_id: `0000000${n}-0000-4000-8000-000000000001`,
      date: `2026-10-0${n}`,
      starts_at: `2026-10-0${n}T09:00:00Z`,
      kind: "lecture",
      topic: `Row ${n}`,
      marks,
      attendance,
      materials_count: 0,
      past: true,
    })
    server.use(
      http.get(apiUrl(`/v1/me/subjects/${ids.physics}/lessons`), () =>
        HttpResponse.json({
          items: [
            row(1, "present", []),
            row(2, "late", [
              { type: "lesson", value: 4 },
              { type: "midterm", value: 5 },
            ]),
            row(3, "absent", []),
          ],
          has_more_past: false,
        }),
      ),
    )
    renderSp(<SubjectPage />, { route: `${PHYSICS}&tab=lessons` })

    const late = (await screen.findByText("Row 2")).closest("li") as HTMLElement
    expect(late).toHaveAttribute("data-attendance", "late")
    expect(within(late).getByText("Late").closest("[data-attendance]")?.className).toContain("bg-orange-700")
    expect(within(late).getByText("Midterm (PC)")).toBeInTheDocument()
    expect(within(late).getAllByText("Lesson").length).toBeGreaterThan(0)
    expect(late.querySelectorAll("[data-mark-type]")).toHaveLength(2)
    const absent = screen.getByText("Row 3").closest("li") as HTMLElement
    expect(absent).toHaveAttribute("data-attendance", "absent")
    expect(within(absent).getByText("Absent").closest("[data-attendance]")?.className).toContain("bg-red-800")
    const present = screen.getByText("Row 1").closest("li") as HTMLElement
    expect(within(present).queryByText("Present")).not.toBeInTheDocument()
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
