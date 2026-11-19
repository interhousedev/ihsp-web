import { describe, expect, test } from "bun:test"
import { fireEvent, screen } from "@testing-library/react"
import { renderAdmissionApp } from "../../tests/helpers"
import { ActivityWizard } from "./components/activity-wizard"
import { emptyForm, parseMonth, type FormState } from "./components/item-fields"

function Host({ onSubmit }: { onSubmit: () => void }) {
  const [form, setForm] = React.useState<FormState>({ ...emptyForm, category: "academic", title: "T" })
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <ActivityWizard value={form} onChange={setForm} />
    </form>
  )
}
import * as React from "react"

describe("ADM-ITEMS", () => {
  test("ADM-ITEMS-1 reaching step 3 does not submit; the Create button is a separate node", async () => {
    let submits = 0
    renderAdmissionApp(<Host onSubmit={() => (submits += 1)} />)
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(submits).toBe(0)
    expect(screen.getByRole("button", { name: "Create" })).toHaveAttribute("type", "submit")
  })

  test("ADM-ITEMS-4 parses typed months", () => {
    expect(parseMonth("2027-02")).toBe("2027-02-01")
    expect(parseMonth("2027-2")).toBe("2027-02-01")
    expect(parseMonth("02.2027")).toBe("2027-02-01")
    expect(parseMonth("2027-13")).toBeNull()
    expect(parseMonth("soon")).toBeNull()
  })
})
