/** EXC-WEB-01..03: the student's excuses: detail thread, cancel, and the form's document rule. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server, weekLessons } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ExcusePage } from "../features/excuses/components/excuse-page"
import { ExcusesPage } from "../features/excuses/components/excuses-page"
import { TimetablePage } from "../features/timetable/components/timetable-page"
import { configureTests, freezeTime, renderSp, setViewportWidth, unfreezeTime } from "./helpers"

configureTests()
const PENDING = "/excuses/view/?id=0000003d-0000-4000-8000-000000000001"

describe("EXC-WEB-01 the list", () => {
  test("shows the requests with their status", async () => {
    renderSp(<ExcusesPage />, { route: "/excuses/" })
    expect(await screen.findByText("Pending")).toBeInTheDocument()
    expect(screen.getByText("Approved")).toBeInTheDocument()
  })
})

describe("EXC-WEB-02 the detail", () => {
  test("a posted line joins the thread", async () => {
    const { user } = renderSp(<ExcusePage />, { route: PENDING })
    const field = await screen.findByLabelText("Message")
    await user.type(field, "Doctor's note follows")
    await user.click(screen.getByRole("button", { name: "Send" }))
    expect(await screen.findByText("Doctor's note follows")).toBeInTheDocument()
  })

  test("cancelling a pending request marks it cancelled", async () => {
    const { user } = renderSp(<ExcusePage />, { route: PENDING })
    await user.click(await screen.findByRole("button", { name: "Cancel request" }))
    const buttons = await screen.findAllByRole("button", { name: "Cancel request" })
    await user.click(buttons[buttons.length - 1] as HTMLElement)
    expect(await screen.findByText("Cancelled")).toBeInTheDocument()
  })
})

describe("EXC-WEB-03 the request form", () => {
  test("a reason that needs a document is not sent without one", async () => {
    const { user } = renderSp(<ExcusesPage />, { route: "/excuses/" })
    await user.click(await screen.findByRole("button", { name: "New request" }))
    await user.click(await screen.findByRole("combobox", { name: "Reason" }))
    await user.click(await screen.findByRole("option", { name: "Olympiad" }))
    await user.click(screen.getByRole("button", { name: "Send request" }))
    expect(await screen.findByText("Attach a document for this reason.")).toBeInTheDocument()
  })
})

describe("EXC-WEB-04 the timetable", () => {
  test("an excused absence carries the Excused badge", async () => {
    freezeTime()
    setViewportWidth(1280)
    const lesson = weekLessons.find((item) => item.status !== "cancelled") as (typeof weekLessons)[number]
    server.use(
      http.get(apiUrl("/v1/me/timetable"), () =>
        HttpResponse.json(
          weekLessons.map((item) =>
            item.id === lesson.id
              ? { ...item, excused: true, excuse: { id: null, template_code: "", origin: "teacher" } }
              : item,
          ),
        ),
      ),
    )
    renderSp(<TimetablePage />, { route: "/timetable/" })
    expect((await screen.findAllByText("Excused")).length).toBeGreaterThan(0)
    unfreezeTime()
  })
})
