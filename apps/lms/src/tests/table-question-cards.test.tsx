import { afterEach, describe, expect, it, mock } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { TableInput } from "../features/player/components/question-inputs"
import type { AttemptQuestion } from "../features/player/utils/answers"

const question = { table: { rows: ["Row A"], columns: ["Yes", "No"] } } as unknown as AttemptQuestion
const desktopWidth = window.innerWidth

afterEach(() => {
  setWidth(desktopWidth)
})

function setWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width })
}

describe("table question on a phone", () => {
  it("shows ticks in a card, not a sideways table", () => {
    setWidth(360)
    const onChange = mock(() => {})
    renderWithProviders(<TableInput question={question} answer={undefined} onChange={onChange} labelledBy="prompt" />)
    expect(screen.queryByRole("table")).toBeNull()
    fireEvent.click(screen.getAllByRole("checkbox")[1]!)
    expect(onChange).toHaveBeenCalledWith({ cells: ["0:1"] })
  })

  it("stays a table from 768 px", () => {
    setWidth(1280)
    renderWithProviders(<TableInput question={question} answer={undefined} onChange={() => {}} labelledBy="prompt" />)
    expect(screen.getByRole("table")).toBeInTheDocument()
  })
})
