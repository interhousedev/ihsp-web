/** ACA-14: the exams list, a head student's suggestion, the preparation page and the Today countdown card. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import {
  apiUrl,
  assessmentIds,
  assessments,
  dashboardLayout,
  flashcardSets,
  ids,
  selectDropdownValue,
  server,
  setDropdownValue,
  studentProfile,
  subjectRefs,
} from "@ihsp/test-utils"
import type { AssessmentItem, SubjectDetail } from "@ihsp/api"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ExamPage } from "../features/exams/components/exam-page"
import { ExamsPage } from "../features/exams/components/exams-page"
import { TodayPage } from "../features/today/components/today-page"
import { configureTests, findCard, freezeTime, renderSp, setValue, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

/** Next's `Link` drops the trailing slash of an internal path in tests; compare paths without it (utils tests cover the slash). */
const path = (href: string) => href.replace(/\/(?=\?|$)/, "")
function hrefOf(element: Element | null | undefined): string | null {
  const href = element?.getAttribute("href")
  return href ? path(href) : null
}

function rowOf(subject: string, control: string): HTMLElement {
  const row = screen
    .getAllByTestId("exam-row")
    .find((item) => item.textContent?.includes(subject) && item.textContent.includes(control))
  if (!row) throw new Error(`no row for ${subject} / ${control}`)
  return row
}

describe("exams list", () => {
  test("splits controls into Upcoming and Past, soonest first", async () => {
    renderSp(<ExamsPage />, { route: "/exams/" })

    const upcoming = await findCard("Upcoming")
    const past = await findCard("Past")

    const rows = within(upcoming).getAllByTestId("exam-row")
    expect(rows).toHaveLength(6)
    expect(rows[0]).toHaveTextContent("English")
    expect(rows.at(-1)).toHaveTextContent("Final")
    expect(within(past).getAllByTestId("exam-row")).toHaveLength(1)
    expect(within(past).getByTestId("exam-row")).toHaveTextContent("Chemistry")
  })

  test("a row names the subject and control, with the date, time, room and countdown", async () => {
    renderSp(<ExamsPage />, { route: "/exams/" })

    await findCard("Upcoming")
    const math = rowOf("Mathematics", "Midterm 1")

    expect(math).toHaveTextContent("Algebra and functions")
    expect(math).toHaveTextContent(/Wed,? 14 Oct · 09:00/)
    expect(math).toHaveTextContent("Room 204")
    expect(math).toHaveTextContent("in 7 days")
    expect(rowOf("Mathematics", "Final")).toHaveTextContent("Room Klaster")
  })

  test("countdown words for today, tomorrow and days ago", async () => {
    const day = (id: string, days: number): AssessmentItem => ({
      ...(assessments[3] as AssessmentItem),
      id,
      days_left: days,
      date: `2026-10-${String(7 + days).padStart(2, "0")}`,
    })
    server.use(
      http.get(apiUrl("/v1/me/assessments"), () =>
        HttpResponse.json({ items: [day("t", 0), day("m", 1), day("p", -3)] }),
      ),
    )
    renderSp(<ExamsPage />, { route: "/exams/" })

    const upcoming = await findCard("Upcoming")
    const past = await findCard("Past")

    expect(within(upcoming).getByText("today")).toBeInTheDocument()
    expect(within(upcoming).getByText("tomorrow")).toBeInTheDocument()
    expect(within(past).getByText("3 days ago")).toBeInTheDocument()
  })

  test("EMIS and head-student controls are marked Not confirmed", async () => {
    renderSp(<ExamsPage />, { route: "/exams/" })

    await findCard("Upcoming")

    expect(within(rowOf("Physics", "Midterm")).getByText("Not confirmed")).toBeInTheDocument()
    expect(within(rowOf("History", "Midterm 2")).getByText("Not confirmed")).toBeInTheDocument()
    expect(within(rowOf("Mathematics", "Midterm 1")).queryByText("Not confirmed")).not.toBeInTheDocument()
  })

  test("a subject with only a control week shows the week and Date not set yet", async () => {
    renderSp(<ExamsPage />, { route: "/exams/" })

    await findCard("Upcoming")
    const english = rowOf("English", "Midterm 1")

    expect(within(english).getByText("Date not set yet")).toBeInTheDocument()
    expect(english).toHaveTextContent("Control week 12–16 Oct")
    expect(english).toHaveTextContent("in 5 days")
  })

  test("every row opens the preparation page", async () => {
    renderSp(<ExamsPage />, { route: "/exams/" })

    await findCard("Upcoming")
    const link = within(rowOf("Mathematics", "Midterm 1")).getByRole("link")

    expect(hrefOf(link)).toBe(path(`/exams/view/?id=${assessmentIds.mathMidterm}`))
  })

  test("the subject filter keeps one subject", async () => {
    renderSp(<ExamsPage />, { route: "/exams/" })

    await findCard("Upcoming")
    setDropdownValue(screen.getByLabelText("Subject"), ids.math)

    await waitFor(() => expect(screen.getAllByTestId("exam-row")).toHaveLength(2))
    for (const row of screen.getAllByTestId("exam-row")) expect(row).toHaveTextContent("Mathematics")
  })

  test("with no controls it says the dates will appear", async () => {
    server.use(http.get(apiUrl("/v1/me/assessments"), () => HttpResponse.json({ items: [] })))
    renderSp(<ExamsPage />, { route: "/exams/" })

    expect(await screen.findByText(/No controls yet/)).toBeInTheDocument()
  })

  test("asks for the wide range of dates", async () => {
    const urls: string[] = []
    server.use(
      http.get(apiUrl("/v1/me/assessments"), ({ request }) => {
        urls.push(request.url)
        return HttpResponse.json({ items: assessments })
      }),
    )
    renderSp(<ExamsPage />, { route: "/exams/" })

    await findCard("Upcoming")

    const search = new URL(urls[0] ?? "").searchParams
    expect(search.get("from")).toBe("2026-06-09")
    expect(search.get("to")).toBe("2027-10-07")
  })
})

describe("suggest a date", () => {
  test("a head student suggests a date and is told it stays unconfirmed", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/me/assessments"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(
          { ...assessments[3], id: "new", status: "tentative", source: "head_student" },
          { status: 201 },
        )
      }),
    )
    const { user } = renderSp(<ExamsPage />, { route: "/exams/" })

    await user.click(await screen.findByRole("button", { name: "Suggest a date" }))
    const dialog = await screen.findByRole("dialog")
    await selectDropdownValue(user, within(dialog).getByLabelText("Subject"), ids.math)
    await selectDropdownValue(user, within(dialog).getByLabelText("Control"), "final")
    setValue(within(dialog).getByLabelText("Date"), "2026-12-15")
    setValue(within(dialog).getByLabelText("Time (optional)"), "09:00")
    setValue(within(dialog).getByLabelText("Room (optional)"), "204")
    await user.click(within(dialog).getByRole("button", { name: "Send suggestion" }))

    await waitFor(() =>
      expect(bodies).toEqual([
        {
          subject_id: ids.math,
          kind: "final",
          date: "2026-12-15",
          starts_at: "2026-12-15T09:00:00+05:00",
          room: "204",
        },
      ]),
    )
    expect(await within(dialog).findByText("Suggestion sent")).toBeInTheDocument()
    expect(within(dialog).getByText(/stays "Not confirmed"/)).toBeInTheDocument()
  })

  test("the new suggestion appears in the list as not confirmed", async () => {
    const { user } = renderSp(<ExamsPage />, { route: "/exams/" })

    await user.click(await screen.findByRole("button", { name: "Suggest a date" }))
    const dialog = await screen.findByRole("dialog")
    await selectDropdownValue(user, within(dialog).getByLabelText("Subject"), ids.physics)
    setValue(within(dialog).getByLabelText("Date"), "2026-11-03")
    await user.click(within(dialog).getByRole("button", { name: "Send suggestion" }))

    await within(dialog).findByText("Suggestion sent")
    await waitFor(() => expect(screen.getAllByTestId("exam-row")).toHaveLength(8))
  })

  test("the form needs a subject and a date", async () => {
    const { user } = renderSp(<ExamsPage />, { route: "/exams/" })

    await user.click(await screen.findByRole("button", { name: "Suggest a date" }))
    const dialog = await screen.findByRole("dialog")

    expect(within(dialog).getByRole("button", { name: "Send suggestion" })).toBeDisabled()
  })

  test("a student who is not the head student has no such button", async () => {
    server.use(http.get(apiUrl("/v1/me/profile"), () => HttpResponse.json({ ...studentProfile, head_student: null })))
    renderSp(<ExamsPage />, { route: "/exams/" })

    await findCard("Upcoming")

    expect(screen.queryByRole("button", { name: "Suggest a date" })).not.toBeInTheDocument()
  })
})

describe("preparation page", () => {
  const view = (id: string) => `/exams/view/?id=${id}`

  test("shows the control, the big countdown, time, room and the note", async () => {
    renderSp(<ExamPage />, { route: view(assessmentIds.mathMidterm) })

    expect(await screen.findByRole("heading", { level: 1, name: "Midterm 1 · Mathematics" })).toBeInTheDocument()
    expect(screen.getByTestId("exam-countdown")).toHaveTextContent("in 7 days")
    expect(screen.getByText("Algebra and functions")).toBeInTheDocument()
    expect(screen.getByText("09:00")).toBeInTheDocument()
    expect(screen.getByText("204")).toBeInTheDocument()
    expect(screen.getByText("Chapters 1–4; bring a calculator.")).toBeInTheDocument()
    expect(screen.queryByText("Not confirmed")).not.toBeInTheDocument()
  })

  test("an EMIS date is marked Not confirmed", async () => {
    renderSp(<ExamPage />, { route: view(assessmentIds.physicsEmis) })

    expect(await screen.findByText("Not confirmed")).toBeInTheDocument()
  })

  test("a week without a date shows the control week", async () => {
    renderSp(<ExamPage />, { route: view(assessmentIds.englishWeek) })

    expect(await screen.findByText("Date not set yet")).toBeInTheDocument()
    expect(screen.getByText("12–16 Oct")).toBeInTheDocument()
    expect(screen.getByTestId("exam-countdown")).toHaveTextContent("in 5 days")
  })

  test("a control week that is running now counts down to 'this week'", async () => {
    const running: AssessmentItem = {
      ...(assessments[1] as AssessmentItem),
      date: "2026-10-07",
      days_left: 0,
      period: { start: "2026-10-05", end: "2026-10-10" },
    }
    server.use(http.get(apiUrl("/v1/me/assessments"), () => HttpResponse.json({ items: [running] })))
    renderSp(<ExamPage />, { route: view(running.id) })

    expect(await screen.findByTestId("exam-countdown")).toHaveTextContent("this week")
  })

  test("an unknown control says it was not found", async () => {
    renderSp(<ExamPage />, { route: view("nope") })

    expect(await screen.findByText(/This control was not found/)).toBeInTheDocument()
  })

  test("lists the decks whose title contains the subject name", async () => {
    renderSp(<ExamPage />, { route: view(assessmentIds.physicsEmis) })

    const decks = await findCard("Your decks")
    const link = await within(decks).findByRole("link", { name: "Physics: kinematics" })

    expect(hrefOf(link)).toBe(path(`/flashcards/set/?id=${flashcardSets[0]?.id}`))
    expect(within(decks).queryByText("English: irregular verbs")).not.toBeInTheDocument()
    expect(hrefOf(within(decks).getByRole("link", { name: "Practice: Physics: kinematics" }))).toBe(
      path(`/flashcards/study/?id=${flashcardSets[0]?.id}`),
    )
  })

  test("Create a deck opens the new-deck editor with a title for the subject", async () => {
    renderSp(<ExamPage />, { route: view(assessmentIds.mathMidterm) })

    const decks = await findCard("Your decks")

    expect(await within(decks).findByText("You have no decks for this subject yet.")).toBeInTheDocument()
    expect(hrefOf(within(decks).getByRole("link", { name: "Create a deck" }))).toBe(
      path("/flashcards/edit/?title=Mathematics+%E2%80%94+exam"),
    )
  })

  describe("lesson materials since the previous control", () => {
    const earlier: AssessmentItem = {
      ...(assessments[3] as AssessmentItem),
      id: "earlier",
      date: "2026-10-02",
      days_left: -5,
      starts_at: null,
      control: "midterm_1",
    }
    const target: AssessmentItem = {
      ...(assessments[3] as AssessmentItem),
      id: "target",
      date: "2026-10-21",
      days_left: 14,
      control: "midterm_2",
      kind: "midterm",
    }
    const lesson = (id: string, date: string, topic: string | null, topicSource: "emis" | "manual" | null) => ({
      id,
      date,
      period: 1,
      starts_at: `${date}T04:00:00Z`,
      ends_at: `${date}T04:45:00Z`,
      subject: subjectRefs.math,
      topic,
      topic_source: topicSource,
      status: "scheduled",
      marks: [],
      attendance: "present",
      homework_text: null,
    })
    const material = (linkId: string, lessonId: string, title: string, extra: object = {}) => ({
      link_id: linkId,
      lesson_id: lessonId,
      role: "material",
      kind: "url",
      short_url: `http://localhost:8000/s/${linkId}`,
      title,
      author: { id: ids.teacherRakhimov, first_name: "Rakhim", last_name: "Rakhimov" },
      hidden: false,
      file: null,
      created_at: "2026-10-06T03:00:00Z",
      source: "user",
      ...extra,
    })
    const detail = {
      subject: subjectRefs.math,
      semester: 4,
      teachers: [],
      averages: { lesson: null, midterm: null, final: null },
      semester_mark: null,
      emis_rating: null,
      absence_rate: null,
      lessons: [
        lesson("l-old", "2026-10-01", null, null),
        lesson("l-5", "2026-10-05", "Topic from EMIS", "emis"),
        lesson("l-6", "2026-10-06", "Quadratic equations", "manual"),
        lesson("l-future", "2026-10-09", null, null),
      ],
      marks: [],
      materials: [
        material("m-old", "l-old", "Before the control"),
        material("m-5", "l-5", "Worksheet 5"),
        material("m-6", "l-6", "Quadratics slides"),
        material("m-hidden", "l-6", "Hidden slides", { hidden: true }),
        material("m-emis", "l-6", "EMIS video", { source: "emis" }),
        material("m-future", "l-future", "Next week"),
      ],
    } as unknown as SubjectDetail

    beforeEach(() => {
      server.use(
        http.get(apiUrl("/v1/me/assessments"), () => HttpResponse.json({ items: [earlier, target] })),
        http.get(apiUrl("/v1/me/subjects/:subjectId"), () => HttpResponse.json(detail)),
      )
    })

    test("lists visible IHSP materials of lessons after the previous control, newest first, with links", async () => {
      renderSp(<ExamPage />, { route: view("target") })

      const section = await findCard("Lesson materials since the previous control")
      const items = await within(section).findAllByTestId("exam-material")

      expect(items).toHaveLength(2)
      expect(items[0]).toHaveTextContent("Quadratics slides")
      expect(items[1]).toHaveTextContent("Worksheet 5")
      expect(hrefOf(within(items[0] as HTMLElement).getByRole("link", { name: "Lesson of 6 Oct" }))).toBe(
        path("/lessons/view/?id=l-6"),
      )
      expect(
        within(items[0] as HTMLElement)
          .getByRole("link", { name: "Open: Quadratics slides" })
          .getAttribute("href"),
      ).toBe("http://localhost:8000/s/m-6")
      expect(within(section).getByText(/Since the previous control: Midterm 1, 2 Oct/)).toBeInTheDocument()
      for (const hidden of ["Hidden slides", "EMIS video", "Next week", "Before the control"])
        expect(within(section).queryByText(hidden)).not.toBeInTheDocument()
    })

    test("a topic EMIS gave is never shown, a teacher's topic is", async () => {
      renderSp(<ExamPage />, { route: view("target") })

      const section = await findCard("Lesson materials since the previous control")
      await within(section).findAllByTestId("exam-material")

      expect(within(section).getByText("Quadratic equations")).toBeInTheDocument()
      expect(within(section).queryByText("Topic from EMIS")).not.toBeInTheDocument()
    })

    test("with no earlier control it lists everything up to today", async () => {
      server.use(http.get(apiUrl("/v1/me/assessments"), () => HttpResponse.json({ items: [target] })))
      renderSp(<ExamPage />, { route: view("target") })

      const section = await findCard("Lesson materials since the previous control")

      expect(await within(section).findAllByTestId("exam-material")).toHaveLength(3)
      expect(within(section).getByText(/No earlier control this semester/)).toBeInTheDocument()
    })

    test("says so when nothing is new", async () => {
      server.use(http.get(apiUrl("/v1/me/subjects/:subjectId"), () => HttpResponse.json({ ...detail, materials: [] })))
      renderSp(<ExamPage />, { route: view("target") })

      expect(await screen.findByText("No new materials since then.")).toBeInTheDocument()
    })
  })

  test("Practice quiz opens the notebooks page, or the link the caller gives", async () => {
    const { unmount } = renderSp(<ExamPage />, { route: view(assessmentIds.mathMidterm) })

    expect(hrefOf(await screen.findByRole("link", { name: "Practice quiz" }))).toBe(path("/notebooks/"))
    unmount()

    renderSp(<ExamPage practiceQuizHref="/notebooks/view/?id=auto" />, { route: view(assessmentIds.mathMidterm) })

    expect(hrefOf(await screen.findByRole("link", { name: "Practice quiz" }))).toBe(path("/notebooks/view/?id=auto"))
  })

  test("links to the mark planner of the subject for a midterm and a final, not for another control", async () => {
    const { unmount } = renderSp(<ExamPage />, { route: view(assessmentIds.mathFinal) })

    expect(hrefOf(await screen.findByRole("link", { name: "Mark planner" }))).toBe(
      path(`/grades/plan/?subject=${ids.math}`),
    )
    unmount()

    const quiz: AssessmentItem = { ...(assessments[3] as AssessmentItem), id: "quiz", kind: "other", control: null }
    server.use(http.get(apiUrl("/v1/me/assessments"), () => HttpResponse.json({ items: [quiz] })))
    renderSp(<ExamPage />, { route: view("quiz") })

    await screen.findByTestId("exam-countdown")
    expect(screen.queryByRole("link", { name: "Mark planner" })).not.toBeInTheDocument()
  })
})

/** The Today dashboard with the controls widget at 2x2 (the 2x1 default shows only the nearest one). */
function useBigControls() {
  const base = dashboardLayout.widgets[0] as (typeof dashboardLayout.widgets)[number]
  server.use(
    http.get(apiUrl("/v1/me/dashboard"), () =>
      HttpResponse.json({
        version: 1,
        widgets: [
          {
            ...base,
            id: "0000000d-0000-4000-8000-0000000000a1",
            kind: "upcoming_controls",
            size: "2x2",
            config: { layout: "2" },
          },
        ],
      }),
    ),
  )
}

describe("Today controls widget", () => {
  beforeEach(useBigControls)

  test("shows the nearest dated control big and the rest in a short list", async () => {
    renderSp(<TodayPage />)

    const card = await findCard("Controls coming up")
    const next = within(card).getByTestId("exam-next")

    expect(next).toHaveTextContent("Midterm 1 · Mathematics · in 7 days")
    const rest = within(card).getAllByTestId("exam-next-item")
    expect(rest.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Physics"),
      expect.stringContaining("English"),
      expect.stringContaining("Informatics"),
    ])
  })

  test("marks the controls that are not confirmed and the weeks without a date", async () => {
    renderSp(<TodayPage />)

    const card = await findCard("Controls coming up")
    const physics = within(card)
      .getAllByTestId("exam-next-item")
      .find((item) => item.textContent?.includes("Physics")) as HTMLElement

    expect(within(physics).getByText("Not confirmed")).toBeInTheDocument()
    expect(within(card).getAllByText("Date not set yet")).toHaveLength(2)
  })

  test("the tile opens the exams list", async () => {
    renderSp(<TodayPage />)

    const card = await findCard("Controls coming up")

    expect(hrefOf(within(card).getByRole("link"))).toBe(path("/exams/"))
  })

  test("asks for the next 14 days from today", async () => {
    const urls: string[] = []
    server.use(
      http.get(apiUrl("/v1/me/assessments"), ({ request }) => {
        urls.push(request.url)
        return HttpResponse.json({ items: assessments })
      }),
    )
    renderSp(<TodayPage />)

    await findCard("Controls coming up")

    const search = new URL(urls[0] ?? "").searchParams
    expect([search.get("from"), search.get("to")]).toEqual(["2026-10-07", "2026-10-21"])
  })

  test("says there is nothing soon when there is nothing in 14 days", async () => {
    server.use(http.get(apiUrl("/v1/me/assessments"), () => HttpResponse.json({ items: [] })))
    renderSp(<TodayPage />)

    const card = await findCard("Controls coming up")
    expect(within(card).getByText("No controls soon.")).toBeInTheDocument()
  })

  test("says there is nothing soon when the request fails, and the rest of Today stays", async () => {
    server.use(http.get(apiUrl("/v1/me/assessments"), () => HttpResponse.json({}, { status: 500 })))
    renderSp(<TodayPage />)

    const card = await findCard("Controls coming up")
    expect(within(card).getByText("No controls soon.")).toBeInTheDocument()
  })
})
