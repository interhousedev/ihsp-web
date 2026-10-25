/** WO-6: open work-off tasks lead the to-do (Upcoming) list and count in the Today homework widget. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, homeworkPhysics, homeworkMath, myWorkOff, myWorkOffs, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { HomeworkPage } from "../features/homework/components/homework-page"
import { configureTests, freezeTime, renderSp, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

describe("Work-offs in the to-do list", () => {
  test("open work-offs lead the Upcoming list, labelled, with subject, lesson date, text and due date", async () => {
    renderSp(<HomeworkPage />, { route: "/homework/" })

    const items = await screen.findAllByTestId("work-off-item")
    const first = items[0] as HTMLElement

    expect(items).toHaveLength(2)
    expect(within(first).getByText("Work-off")).toBeInTheDocument()
    expect(within(first).getByText("Mathematics")).toBeInTheDocument()
    expect(within(first).getByText(/Solve exercises 12-15/)).toBeInTheDocument()
    expect(within(first).getByText(/Lesson/)).toBeInTheDocument()
    expect(within(first).getByText(/Due/)).toBeInTheDocument()
    expect(first).toHaveAttribute("data-overdue", "false")

    const list = first.closest("ul") as HTMLElement
    expect(list.firstElementChild).toBe(first)
    expect(within(list).getByText(homeworkMath.text)).toBeInTheDocument()
  })

  test("an overdue work-off is styled as overdue", async () => {
    renderSp(<HomeworkPage />, { route: "/homework/" })

    const items = await screen.findAllByTestId("work-off-item")
    const overdue = items[1] as HTMLElement

    expect(within(overdue).getByText("Physics")).toBeInTheDocument()
    expect(within(overdue).getByText("Overdue")).toBeInTheDocument()
    expect(overdue).toHaveAttribute("data-overdue", "true")
    expect(overdue.className).toContain("border-destructive")
  })

  test("the item links to the lesson it was given for", async () => {
    renderSp(<HomeworkPage />, { route: "/homework/" })

    const first = (await screen.findAllByTestId("work-off-item"))[0] as HTMLElement
    const link = within(first).getByRole("link")

    expect(link.getAttribute("href")).toContain("/lessons/view")
    expect(link.getAttribute("href")).toContain(encodeURIComponent(myWorkOffs[0]?.lesson_id ?? ""))
  })

  test("work-offs without a due date show the no-due-date text", async () => {
    server.use(
      http.get(apiUrl("/v1/me/work-offs"), () =>
        HttpResponse.json([myWorkOff({ due_date: null, subject_name: "Chemistry" })]),
      ),
    )
    renderSp(<HomeworkPage />, { route: "/homework/" })

    const item = (await screen.findByTestId("work-off-item")) as HTMLElement

    expect(within(item).getByText(/No due date/)).toBeInTheDocument()
  })

  test("work-offs are not shown on the Later or Done tabs", async () => {
    renderSp(<HomeworkPage />, { route: "/homework/?tab=later" })

    expect(await screen.findByText(homeworkPhysics.text)).toBeInTheDocument()
    expect(screen.queryByTestId("work-off-item")).not.toBeInTheDocument()
  })

  test("with no homework but open work-offs the list is not empty", async () => {
    server.use(
      http.get(apiUrl("/v1/me/homework"), () => HttpResponse.json([])),
      http.get(apiUrl("/v1/me/work-offs"), () => HttpResponse.json([myWorkOff()])),
    )
    renderSp(<HomeworkPage />, { route: "/homework/" })

    expect(await screen.findByTestId("work-off-item")).toBeInTheDocument()
    expect(screen.queryByText("Nothing due.")).not.toBeInTheDocument()
  })
})
