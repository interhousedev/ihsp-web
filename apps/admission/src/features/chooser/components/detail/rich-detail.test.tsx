import { describe, expect, it } from "bun:test"
import { screen, within } from "@testing-library/react"
import { institution, richInstitution } from "../../../../tests/chooser-handlers"
import { renderAdmissionApp } from "../../../../tests/helpers"
import { RichSections } from "./rich-detail"

describe("rich school details", () => {
  it("shows sections with rows and source chips, and hides sections without rows", () => {
    renderAdmissionApp(
      <RichSections
        institution={richInstitution()}
        groups={["overview", "selectivity", "costs", "english", "credentials", "application", "visa"]}
      />,
    )
    expect(screen.getByRole("heading", { name: "Selectivity" })).toBeTruthy()
    expect(screen.queryByRole("heading", { name: "Visa" })).toBeNull()
    expect(screen.getByText("4-6%")).toBeTruthy()
    const link = screen.getByRole("link", { name: (name) => name.includes("rich.edu") })
    expect(link.getAttribute("href")).toBe("https://www.rich.edu/facts")
    expect(link.getAttribute("rel")).toBe("noopener noreferrer")
    expect(link.textContent).toContain("2025 · rich.edu")
    expect(screen.getByText("Unverified")).toBeTruthy()
  })

  it("lists admission factors with their level and a legend", () => {
    renderAdmissionApp(<RichSections institution={richInstitution()} groups={["selectivity", "application"]} />)
    const factors = screen.getByTestId("factors")
    expect(within(factors).getByText("GPA")).toBeTruthy()
    expect(within(factors).getAllByText("Very important").length).toBe(2)
    expect(within(factors).getAllByText("Not considered").length).toBe(2)
  })

  it("shows a binding deadline in Asia/Tashkent with the school's time zone", () => {
    renderAdmissionApp(<RichSections institution={richInstitution()} groups={["selectivity", "application"]} />)
    const deadlines = screen.getByTestId("deadlines")
    expect(within(deadlines).getByText("ED")).toBeTruthy()
    expect(within(deadlines).getByText("Binding")).toBeTruthy()
    expect(within(deadlines).getByText(/America\/New_York/)).toBeTruthy()
    expect(within(deadlines).getByText(/Nov 2, 2026/)).toBeTruthy()
  })

  it("hides empty sections", () => {
    renderAdmissionApp(
      <RichSections institution={institution({ details: [] })} groups={["selectivity", "application"]} />,
    )
    expect(screen.queryByTestId("factors")).toBeNull()
    expect(screen.queryByTestId("deadlines")).toBeNull()
  })
})
