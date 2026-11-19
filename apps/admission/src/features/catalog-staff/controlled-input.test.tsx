import { fireEvent, screen } from "@testing-library/react"
import { afterEach, describe, expect, spyOn, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { FactSpecItem } from "./api"
import type { Draft } from "./fact-draft"
import { FactField } from "./components/fact-field"

const ITEM = {
  key: "acceptance_rate",
  kind: "int",
  label: "Acceptance rate",
  min: 0,
  max: 100,
  step: 1,
  unit: null,
  options: [],
  parts: [],
} as unknown as FactSpecItem

describe("controlled inputs", () => {
  afterEach(() => {
    spyOn(console, "error").mockRestore()
  })

  test("a missing draft value does not flip the input to uncontrolled", () => {
    const error = spyOn(console, "error").mockImplementation(() => {})
    renderAdmissionApp(<FactField item={ITEM} draft={undefined as unknown as Draft} onChange={() => {}} />)
    const input = screen.getByLabelText("Acceptance rate")
    expect((input as HTMLInputElement).value).toBe("")
    fireEvent.change(input, { target: { value: "43" } })
    const messages = error.mock.calls.map((call) => String(call[0]))
    expect(
      messages.some((m) => /controlled input to be uncontrolled|uncontrolled input to be controlled/.test(m)),
    ).toBe(false)
  })
})
