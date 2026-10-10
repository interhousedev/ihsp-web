/** UF-WEB-05: the subject hub, one lesson list built around now, and the ask-AI action. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, ids, notebookDetail, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { SubjectPage } from "../features/subjects/components/subject-page"
import { notebookDraftKey } from "../features/subjects/utils/ask-lesson"
import { configureTests, freezeTime, renderSp, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

const HUB = `/subjects/view/?id=${ids.physics}&semester=4&tab=lessons`

describe("subject hub", () => {
  test("lists the recent past lessons first and the upcoming ones after, never both mixed", async () => {
    renderSp(<SubjectPage />, { route: HUB })

    const past = await screen.findByRole("region", { name: "Recent lessons" })
    const upcoming = screen.getByRole("region", { name: "Next 14 days" })

    for (const item of within(past).getAllByRole("listitem")) expect(item.getAttribute("data-past")).toBe("true")
    for (const item of within(upcoming).getAllByRole("listitem")) expect(item.getAttribute("data-past")).toBe("false")
  })

  test("attendance and marks show only on lessons that already happened", async () => {
    renderSp(<SubjectPage />, { route: HUB })

    const upcoming = await screen.findByRole("region", { name: "Next 14 days" })
    const past = screen.getByRole("region", { name: "Recent lessons" })

    expect(within(upcoming).queryByText("Present")).not.toBeInTheDocument()
    expect(within(upcoming).queryByText("Absent")).not.toBeInTheDocument()
    expect(within(past).getAllByText("Present").length).toBeGreaterThan(0)
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
          items: [
            {
              lesson_id: ids.lessonPhysicsToday,
              date: "2026-10-05",
              starts_at: "2026-10-05T05:00:00Z",
              kind: "lecture",
              topic: "Waves",
              mark: null,
              attendance: "present",
              materials_count: 0,
              past: true,
            },
          ],
          has_more_past: limits.length === 1,
        })
      }),
    )
    const { user } = renderSp(<SubjectPage />, { route: HUB })

    await user.click(await screen.findByRole("button", { name: "Show more" }))

    await waitFor(() => expect(limits).toEqual(["10", "20"]))
  })

  test("Ask AI about this lesson opens the subject notebook with the lesson and a prefilled question", async () => {
    testRouter.push.mockClear()
    const { user } = renderSp(<SubjectPage />, { route: HUB })

    const past = await screen.findByRole("region", { name: "Recent lessons" })
    await user.click(within(past).getAllByRole("button", { name: "Ask AI about this lesson" })[0] as HTMLElement)

    await waitFor(() => expect(testRouter.push).toHaveBeenCalled())
    const href = String(testRouter.push.mock.calls[0]?.[0])
    expect(href).toStartWith(`/notebooks/view/?id=${notebookDetail.id}&lesson=`)
    expect(window.sessionStorage.getItem(notebookDraftKey(notebookDetail.id))).toContain("lesson")
  })
})
