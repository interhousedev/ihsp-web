/** Temporary marks: the lesson journal section and the "Pending for EMIS" page. */
import { describe, expect, test } from "bun:test"
import { apiUrl, ids } from "@ihsp/test-utils"
import { server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { LessonPage } from "../features/lessons/components/lesson-page"
import { TemporaryMarksPage } from "../features/temporary-marks/components/temporary-marks-page"
import { configureTests, renderStaff } from "./helpers"

configureTests()

const ROUTE = `/lessons/view/?id=${ids.lessonPhysicsToday}`

async function journal(): Promise<HTMLElement> {
  const heading = await screen.findByRole("heading", { name: "Journal" })
  return heading.closest("section") as HTMLElement
}

describe("lesson journal", () => {
  test("shows the seeded mark", async () => {
    renderStaff(<LessonPage />, { route: ROUTE })

    const section = await journal()
    await waitFor(() => expect(within(section).getByDisplayValue("Oral answer")).toBeInTheDocument())
    expect(within(section).getAllByRole("button", { name: /^Give .* a 4$/ })[0]).toBeDefined()
    expect(within(section).getAllByRole("button", { name: /^Remove mark for/ })).toHaveLength(1)
  })

  test("sets a mark with PUT", async () => {
    const bodies: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/staff/lessons/:id/temporary-marks/:studentId"), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    const section = await journal()
    await within(section).findByDisplayValue("Oral answer")
    const withoutMark = within(section)
      .getAllByRole("button", { name: /^Save mark for/ })
      .find((button) => !button.closest("li")?.querySelector("button[aria-label^='Remove']"))
    expect(withoutMark).toBeDefined()
    const row = withoutMark?.closest("li") as HTMLElement
    await user.click(within(row).getByRole("button", { name: /a 5$/ }))
    await user.click(within(row).getByRole("button", { name: /^Save mark for/ }))

    await waitFor(() => expect(bodies).toEqual([{ value: 5, comment: null }]))
  })

  test("removes a mark with DELETE", async () => {
    const calls: string[] = []
    server.use(
      http.delete(apiUrl("/v1/staff/lessons/:id/temporary-marks/:studentId"), ({ params }) => {
        calls.push(String(params.studentId))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderStaff(<LessonPage />, { route: ROUTE })

    const section = await journal()
    await user.click(await within(section).findByRole("button", { name: /^Remove mark for/ }))

    await waitFor(() => expect(calls).toEqual([ids.student]))
  })
})

describe("pending for EMIS page", () => {
  test("groups marks by lesson with a link to it", async () => {
    renderStaff(<TemporaryMarksPage />)

    expect(await screen.findByText("Oral answer")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: /Physics/ })
    expect(link.getAttribute("href")).toContain(`/lessons/view?id=${ids.lessonPhysicsToday}`)
  })

  test("says when nothing is pending", async () => {
    server.use(http.get(apiUrl("/v1/staff/temporary-marks/pending"), () => HttpResponse.json({ items: [] })))
    renderStaff(<TemporaryMarksPage />)

    expect(await screen.findByText("No marks are waiting for EMIS.")).toBeInTheDocument()
  })
})
