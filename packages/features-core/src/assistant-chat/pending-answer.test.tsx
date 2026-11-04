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

  it("shows the steps as a collapsed grey trace before any answer text", () => {
    const steps = [
      { id: "think-1", kind: "think", label: "Сначала найду предмет.", status: "done", duration_ms: 0 },
      { id: "s1", kind: "tool", label: "get_marks", status: "running" },
    ] as const
    renderNotebook(<PendingAnswer live={{ status: "", steps: [...steps], text: "" }} />)

    expect(screen.getByRole("button", { name: "Show the steps of this answer" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
    expect(screen.queryByText("Сначала найду предмет.")).toBeNull()
  })

  it("never shows a progress note as the status line; the status falls back to Thinking…", () => {
    const note = "Сначала найду предмет."
    renderNotebook(
      <PendingAnswer
        live={{
          status: "",
          steps: [{ id: "think-1", kind: "think", label: note, status: "done", duration_ms: 0 }],
          text: "",
          note,
        }}
      />,
    )

    expect(screen.getByRole("status")).toHaveTextContent("Thinking…")
  })
})
