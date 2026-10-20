import { describe, expect, it } from "bun:test"
import { apiUrl, renderWithProviders, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import en from "../../../../messages/en.json"
import { WorkOffCard } from "./work-off-card"

const render = () => renderWithProviders(<WorkOffCard />, { messages: en, route: "/timetable/" })

describe("WO-6 work-off tasks card", () => {
  it("lists the open work-offs with lesson, teacher, status and due date", async () => {
    render()

    const first = (await screen.findByText(/Solve exercises 12-15/)).closest("li") as HTMLElement
    expect(screen.getByRole("heading", { name: "Work-off tasks" })).toBeInTheDocument()
    expect(within(first).getByText("Mathematics")).toBeInTheDocument()
    expect(within(first).getByText("Period 3")).toBeInTheDocument()
    expect(within(first).getByText("Rakhimov A.")).toBeInTheDocument()
    expect(within(first).getByText("To do")).toBeInTheDocument()
    expect(within(first).getByText(/Due /)).toBeInTheDocument()
    expect(screen.queryByText("Essay.")).not.toBeInTheDocument()
  })

  it("keeps the line breaks of the task text", async () => {
    render()

    const text = await screen.findByText(/Write the proof of the theorem/)

    expect(text.className).toContain("whitespace-pre-line")
  })

  it("marks a work-off past its due date as overdue", async () => {
    render()

    const late = (await screen.findByText("Read chapter 4.")).closest("li") as HTMLElement

    expect(within(late).getByText("Overdue")).toBeInTheDocument()
    const onTime = screen.getByText(/Solve exercises 12-15/).closest("li") as HTMLElement
    expect(within(onTime).queryByText("Overdue")).not.toBeInTheDocument()
  })

  it("renders nothing when there are no open work-offs", async () => {
    server.use(http.get(apiUrl("/v1/me/work-offs"), () => HttpResponse.json([])))

    const { container } = render()
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(container.querySelector("section")).toBeNull()
  })

  it("shows an error with a retry when the request fails", async () => {
    server.use(http.get(apiUrl("/v1/me/work-offs"), () => HttpResponse.json({ title: "x" }, { status: 500 })))

    render()

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
  })
})
