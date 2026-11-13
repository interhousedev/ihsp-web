import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { DatePicker } from "../components/date-picker"

function setup(onChange: (value: string | null) => void) {
  renderWithProviders(
    <DatePicker
      aria-label="Birth"
      value={null}
      onChange={onChange}
      min="1950-01-01"
      max="2026-01-01"
      typed
      required
      closeOnSelect
    />,
  )
  return screen.getByRole("textbox", { name: "Birth" }) as HTMLInputElement
}

describe("DatePicker typed input", () => {
  it("turns typed digits into a formatted date and reports the ISO value", () => {
    const calls: Array<string | null> = []
    const input = setup((v) => calls.push(v))
    expect(input.inputMode).toBe("numeric")
    fireEvent.change(input, { target: { value: "28012009" } })
    expect(input.value).toBe("28.01.2009")
    expect(calls.at(-1)).toBe("2009-01-28")
  })

  it("rejects impossible and out-of-range dates", () => {
    const calls: Array<string | null> = []
    const input = setup((v) => calls.push(v))
    for (const bad of ["31022009", "01011949", "01012030"]) {
      fireEvent.change(input, { target: { value: bad } })
      expect(input).toHaveAttribute("aria-invalid", "true")
    }
    expect(calls.every((v) => v === null)).toBe(true)
  })
})
