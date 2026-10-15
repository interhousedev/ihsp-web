import { describe, expect, it } from "bun:test"
import { screen } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { PendingAnswer } from "./pending-answer"

allowSlowRenders()

describe("PendingAnswer", () => {
  it("is one status line: Thinking… until the server names the current step", () => {
    const first = renderNotebook(<PendingAnswer live={null} />)
    expect(screen.getByRole("status")).toHaveTextContent("Thinking…")
    first.unmount()

    renderNotebook(<PendingAnswer live={{ status: "Посмотрел ваши оценки", steps: [], text: "" }} />)

    expect(screen.getAllByTestId("pending-answer")).toHaveLength(1)
    expect(screen.getByRole("status")).toHaveTextContent("Посмотрел ваши оценки")
  })

  it("shows the streamed answer under its collapsed steps", () => {
    const step = { id: "1", kind: "tool", label: "get_marks", status: "done", duration_ms: 300 } as const
    renderNotebook(<PendingAnswer live={{ status: "x", steps: [step], text: "Ваши оценки" }} />)

    expect(screen.getByText("Ваши оценки")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Show the steps of this answer" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})
