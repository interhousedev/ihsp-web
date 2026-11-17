import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { renderAdmissionApp } from "../../tests/helpers"
import { StepperWizard, type StepAnswers, type StepQuestion } from "."

const questions: StepQuestion[] = [
  {
    id: "a",
    section: "s",
    sectionLabel: "Sec",
    title: "First?",
    kind: "single",
    options: [
      { value: "x", label: "Ex" },
      { value: "y", label: "Why" },
    ],
  },
  {
    id: "b",
    section: "s",
    sectionLabel: "Sec",
    title: "Second?",
    kind: "single",
    options: [{ value: "p", label: "Pee" }],
  },
]
const labels = {
  back: "Back",
  next: "Next",
  finish: "Finish",
  saving: "Saving",
  saveError: "Oops",
  step: (c: number, t: number) => `Q${c}/${t}`,
  progress: "Progress",
}

function Harness({
  initial = {},
  initialStep,
  onStepDone,
  onFinish = () => {},
}: {
  initial?: StepAnswers
  initialStep?: number
  onStepDone?: () => Promise<void>
  onFinish?: () => void
}) {
  const [answers, setAnswers] = useState<StepAnswers>(initial)
  return (
    <StepperWizard
      questions={questions}
      answers={answers}
      onAnswer={(id, v) => setAnswers((p) => ({ ...p, [id]: v }))}
      initialStep={initialStep}
      onStepDone={onStepDone}
      onFinish={onFinish}
      labels={labels}
    />
  )
}

afterEach(cleanup)

describe("StepperWizard", () => {
  test("Next is disabled until answered, Back returns", async () => {
    renderAdmissionApp(<Harness />)
    const next = screen.getByRole("button", { name: "Next" }) as HTMLButtonElement
    expect(next.disabled).toBe(true)
    fireEvent.click(screen.getByRole("radio", { name: /Ex/ }))
    await waitFor(() => expect(next.disabled).toBe(false))
    fireEvent.click(next)
    await screen.findByRole("heading", { name: "Second?" })
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    await screen.findByRole("heading", { name: "First?" })
  })
  test("resumes at initialStep", () => {
    renderAdmissionApp(<Harness initial={{ a: "x" }} initialStep={1} />)
    expect(screen.getByRole("heading", { name: "Second?" })).toBeTruthy()
  })
  test("rejected save keeps the step", async () => {
    const onStepDone = mock(async () => {
      throw new Error("no")
    })
    renderAdmissionApp(<Harness initial={{ a: "x" }} onStepDone={onStepDone} />)
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    await screen.findByText("Oops")
    expect(screen.getByRole("heading", { name: "First?" })).toBeTruthy()
  })
})
