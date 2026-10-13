import { describe, expect, it } from "bun:test"
import type { AgentStep } from "@ihsp/api"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { StepTrace } from "./step-trace"

allowSlowRenders()

const steps: AgentStep[] = [
  {
    id: "1",
    kind: "read_file",
    label: "Reviewed uploaded file",
    target: "Essay.docx",
    status: "done",
    duration_ms: 1200,
  },
  { id: "2", kind: "web_search", label: "Searched the web", status: "done", duration_ms: 800 },
  { id: "3", kind: "tool", label: "get_schedule", status: "failed" },
]

describe("AI-STEPS StepTrace", () => {
  it("is collapsed by default: one grey line with the count and the time", () => {
    renderNotebook(<StepTrace steps={steps} />)

    const toggle = screen.getByRole("button", { name: "Show the steps of this answer" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(toggle).toHaveTextContent("3 steps")
    expect(toggle).toHaveTextContent("2.0s")
    expect(screen.queryByRole("list", { name: "Steps of this answer" })).not.toBeInTheDocument()
  })

  it("opens into rows; a row with a file opens to show the file chip", async () => {
    const user = userEvent.setup()
    renderNotebook(<StepTrace steps={steps} />)

    await user.click(screen.getByRole("button", { name: "Show the steps of this answer" }))

    expect(screen.getByRole("list", { name: "Steps of this answer" })).toBeInTheDocument()
    expect(screen.getByText("Searched the web")).toBeInTheDocument()
    expect(screen.getByText("Opened the schedule")).toBeInTheDocument()
    expect(screen.getByText("Failed")).toBeInTheDocument()
    const fileRow = screen.getByRole("button", { name: /Reviewed uploaded “Essay.docx”/ })
    expect(fileRow).toHaveAttribute("aria-expanded", "false")
    await user.click(fileRow)
    expect(fileRow).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByTitle("Essay.docx")).toBeInTheDocument()
  })

  it("names the running step while the answer is written", () => {
    renderNotebook(
      <StepTrace live steps={[{ id: "r", kind: "retrieve", label: "Searched the sources", status: "running" }]} />,
    )

    expect(screen.getByRole("button", { name: "Show the steps of this answer" })).toHaveTextContent(
      "Searching the sources…",
    )
  })

  it("renders nothing without steps", () => {
    renderNotebook(<StepTrace steps={[]} />)

    expect(screen.queryByRole("button", { name: "Show the steps of this answer" })).not.toBeInTheDocument()
  })
})
