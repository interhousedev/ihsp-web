import { describe, expect, it, mock } from "bun:test"
import { notebookDetail } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SuggestedQuestions } from "./suggested-questions"

allowSlowRenders()

const questions = notebookDetail.summary?.suggested_questions ?? []
const [first, second, third, fourth] = questions as [string, string, string, string]

function renderQuestions(list: readonly string[] = questions, props: { disabled?: boolean } = {}) {
  const onAsk = mock((_text: string) => undefined)
  const result = renderNotebook(<SuggestedQuestions questions={list} onAsk={onAsk} {...props} />)
  return { ...result, onAsk }
}

describe("SuggestedQuestions", () => {
  it("shows three question cards and a Show more button", () => {
    renderQuestions()

    const section = screen.getByRole("region", { name: "Suggested questions" })
    for (const text of [first, second, third]) {
      expect(within(section).getByRole("button", { name: text })).toBeInTheDocument()
    }
    expect(within(section).queryByRole("button", { name: fourth })).not.toBeInTheDocument()
    const more = within(section).getByRole("button", { name: "Show more" })
    expect(more).toHaveAttribute("aria-expanded", "false")
  })

  it("draws the questions as cards in a container-query grid", () => {
    renderQuestions()

    const section = screen.getByRole("region", { name: "Suggested questions" })
    expect(section).toHaveClass("@container")
    const grid = within(section).getByRole("list")
    expect(grid).toHaveClass("grid", "grid-cols-1", "@md:grid-cols-3")
    expect(within(section).getByRole("button", { name: first })).toHaveClass("rounded-2xl", "bg-muted/50", "p-3")
  })

  it("reveals the others with Show more and folds them again", async () => {
    const { user } = renderQuestions()

    await user.click(screen.getByRole("button", { name: "Show more" }))

    expect(screen.getByRole("button", { name: fourth })).toBeInTheDocument()
    const less = screen.getByRole("button", { name: "Show less" })
    expect(less).toHaveAttribute("aria-expanded", "true")

    await user.click(less)

    expect(screen.queryByRole("button", { name: fourth })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Show more" })).toHaveAttribute("aria-expanded", "false")
  })

  it("asks the question of the clicked card, also one revealed by Show more", async () => {
    const { user, onAsk } = renderQuestions()

    await user.click(screen.getByRole("button", { name: second }))
    expect(onAsk).toHaveBeenLastCalledWith(second)

    await user.click(screen.getByRole("button", { name: "Show more" }))
    await user.click(screen.getByRole("button", { name: fourth }))
    expect(onAsk).toHaveBeenLastCalledWith(fourth)
  })

  it("has no Show more button when there are three questions or fewer", () => {
    renderQuestions([first, second, third])

    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
  })

  it("disables the cards while a turn runs", () => {
    renderQuestions(questions, { disabled: true })

    expect(screen.getByRole("button", { name: first })).toBeDisabled()
  })

  it("renders nothing without questions", () => {
    renderQuestions([])

    expect(screen.queryByRole("region")).not.toBeInTheDocument()
  })
})
