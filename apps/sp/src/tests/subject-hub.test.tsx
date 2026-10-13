/** UF-WEB-05: the subject hub, one lesson list built around now, and the ask-AI action. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, ids, notebookDetail, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { takeChatAttachments } from "@ihsp/features-core"
import { HttpResponse, http } from "msw"
import { SubjectPage } from "../features/subjects/components/subject-page"
import { configureTests, freezeTime, renderSp, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

const HUB = `/subjects/view/?id=${ids.physics}&semester=4&tab=lessons`

type LessonFixture = {
  lesson_id: string
  date: string
  starts_at: string
  kind: string
  topic: string | null
  marks: { type: "lesson" | "midterm" | "final"; value: number }[]
  attendance: "present" | "absent" | "late" | null
  materials_count: number
  past: boolean
}

const PAST: LessonFixture = {
  lesson_id: "lesson-past",
  date: "2026-10-05",
  starts_at: "2026-10-05T05:00:00Z",
  kind: "lecture",
  topic: "Waves",
  marks: [],
  attendance: null,
  materials_count: 0,
  past: true,
}

const UPCOMING: LessonFixture = {
  lesson_id: "lesson-upcoming",
  date: "2026-10-12",
  starts_at: "2026-10-12T05:00:00Z",
  kind: "practice",
  topic: "Optics",
  marks: [],
  attendance: null,
  materials_count: 0,
  past: false,
}

/** Serves one past lesson (with the given marks and attendance) and one upcoming lesson, and records the query. */
function serveLessons(past: Partial<LessonFixture>, query: URLSearchParams[] = []) {
  server.use(
    http.get(apiUrl("/v1/me/subjects/:subjectId/lessons"), ({ request }) => {
      query.push(new URL(request.url).searchParams)
      return HttpResponse.json({ items: [{ ...PAST, ...past }, UPCOMING], has_more_past: false })
    }),
  )
}

describe("subject hub", () => {
  test("lists the recent past lessons first and the upcoming ones after, never both mixed", async () => {
    renderSp(<SubjectPage />, { route: HUB })

    const past = await screen.findByRole("region", { name: "Recent lessons" })
    const upcoming = screen.getByRole("region", { name: "Next 14 days" })

    for (const item of within(past).getAllByRole("listitem")) expect(item.getAttribute("data-past")).toBe("true")
    for (const item of within(upcoming).getAllByRole("listitem")) expect(item.getAttribute("data-past")).toBe("false")
  })

  test("a present lesson shows no attendance badge, and upcoming lessons show no marks or attendance", async () => {
    renderSp(<SubjectPage />, { route: HUB })

    const upcoming = await screen.findByRole("region", { name: "Next 14 days" })
    const past = screen.getByRole("region", { name: "Recent lessons" })

    expect(within(past).queryByText("Present")).not.toBeInTheDocument()
    expect(within(upcoming).queryByText("Present")).not.toBeInTheDocument()
    expect(within(upcoming).queryByText("Absent")).not.toBeInTheDocument()
    expect(within(upcoming).queryByText("Late")).not.toBeInTheDocument()
    expect(upcoming.querySelectorAll("[data-mark-type], [data-attendance]")).toHaveLength(0)
  })

  test("a past lesson with mark 5 shows the mark as a chip", async () => {
    serveLessons({ marks: [{ type: "lesson", value: 5 }], attendance: "present" })
    renderSp(<SubjectPage />, { route: HUB })

    const past = await screen.findByRole("region", { name: "Recent lessons" })
    const chip = within(past).getByText("5")

    expect(chip.closest("[data-mark-type]")?.getAttribute("data-mark-type")).toBe("lesson")
    expect(within(past).queryByText("Present")).not.toBeInTheDocument()
  })

  test("every mark of a lesson shows, not only the first", async () => {
    serveLessons({
      marks: [
        { type: "lesson", value: 5 },
        { type: "lesson", value: 3 },
        { type: "midterm", value: 4 },
      ],
    })
    renderSp(<SubjectPage />, { route: HUB })

    const past = await screen.findByRole("region", { name: "Recent lessons" })
    const row = within(past).getAllByRole("listitem")[0] as HTMLElement

    expect(row.querySelectorAll("[data-mark-type]")).toHaveLength(3)
    expect(within(row).getByText("5")).toBeInTheDocument()
    expect(within(row).getByText("3")).toBeInTheDocument()
    expect(within(row).getByText("4")).toBeInTheDocument()
  })

  test("an absent lesson shows the Absent badge", async () => {
    serveLessons({ attendance: "absent" })
    renderSp(<SubjectPage />, { route: HUB })

    const past = await screen.findByRole("region", { name: "Recent lessons" })
    const badge = within(past).getByText("Absent")

    expect(badge.getAttribute("data-attendance")).toBe("absent")
    expect(badge.className).toContain("bg-red-800")
  })

  test("a late lesson shows the Late badge", async () => {
    serveLessons({ attendance: "late" })
    renderSp(<SubjectPage />, { route: HUB })

    const past = await screen.findByRole("region", { name: "Recent lessons" })
    const badge = within(past).getByText("Late")

    expect(badge.getAttribute("data-attendance")).toBe("late")
    expect(badge.className).toContain("bg-orange-700")
  })

  test("an upcoming lesson shows neither a mark nor attendance", async () => {
    serveLessons({ marks: [{ type: "lesson", value: 4 }], attendance: "absent" })
    renderSp(<SubjectPage />, { route: HUB })

    const upcoming = await screen.findByRole("region", { name: "Next 14 days" })

    expect(within(upcoming).getByText("Optics")).toBeInTheDocument()
    expect(upcoming.querySelectorAll("[data-mark-type], [data-attendance]")).toHaveLength(0)
    expect(within(upcoming).queryByText("Absent")).not.toBeInTheDocument()
  })

  test("the lesson list asks for the semester the subject page shows", async () => {
    const queries: URLSearchParams[] = []
    serveLessons({}, queries)
    renderSp(<SubjectPage />, { route: HUB })

    await screen.findByRole("region", { name: "Recent lessons" })

    expect(queries.at(-1)?.get("semester")).toBe("4")
  })

  test("a lesson row opens the lesson", async () => {
    renderSp(<SubjectPage />, { route: HUB })

    const past = await screen.findByRole("region", { name: "Recent lessons" })
    const link = within(past).getAllByRole("link")[0]

    expect(link?.getAttribute("href")).toMatch(/^\/lessons\/view\/?\?id=/)
  })

  test("show more asks the server for older lessons", async () => {
    const limits: string[] = []
    server.use(
      http.get(apiUrl("/v1/me/subjects/:subjectId/lessons"), ({ request }) => {
        limits.push(new URL(request.url).searchParams.get("past_limit") ?? "")
        return HttpResponse.json({
          items: [{ ...PAST, lesson_id: ids.lessonPhysicsToday, attendance: "present" }],
          has_more_past: limits.length === 1,
        })
      }),
    )
    const { user } = renderSp(<SubjectPage />, { route: HUB })

    await user.click(await screen.findByRole("button", { name: "Show more" }))

    await waitFor(() => expect(limits).toEqual(["10", "20"]))
  })

  test("Ask AI about this lesson opens the subject notebook with the lesson attached as a chip", async () => {
    testRouter.push.mockClear()
    const { user } = renderSp(<SubjectPage />, { route: HUB })

    const past = await screen.findByRole("region", { name: "Recent lessons" })
    await user.click(within(past).getAllByRole("button", { name: "Ask AI about this lesson" })[0] as HTMLElement)

    await waitFor(() => expect(testRouter.push).toHaveBeenCalled())
    const href = String(testRouter.push.mock.calls[0]?.[0])
    expect(href).toStartWith(`/notebooks/view/?id=${notebookDetail.id}&lesson=`)
    const left = takeChatAttachments(notebookDetail.id)
    expect(left).toHaveLength(1)
    expect(left[0]).toMatchObject({ kind: "lesson", attachment: { kind: "lesson", id: href.split("lesson=")[1] } })
    expect(left[0]?.label).toContain("Physics")
  })
})
