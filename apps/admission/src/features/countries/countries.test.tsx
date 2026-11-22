import { screen } from "@testing-library/react"
import { describe, expect, test } from "bun:test"
import type { Messages } from "@ihsp/i18n"
import { countriesHandlers, server } from "@ihsp/test-utils"
import { renderAdmissionApp } from "../../tests/helpers"
import { CountryInfoRow } from "./components/country-info"
import { fireEvent } from "@testing-library/react"

const messages = {
  countries: {
    infoAbout: "Facts about {country}",
    compare: "Compare",
    unverified: "Unverified",
    verified: "Verified",
    asOf: "As of {date}",
    overall: "Overall",
    noFacts: "No facts",
    loadFailed: "Failed",
    fact: { cost_of_living: "Cost of living", opportunities: "Opportunities" },
    field: { cs_it: "CS and IT", engineering: "Engineering" },
  },
} as unknown as Messages

describe("country facts", () => {
  test("the info button opens the dialog with the facts and the student's field", async () => {
    server.use(...countriesHandlers)
    renderAdmissionApp(<CountryInfoRow codes={["FR"]} />, { messages })
    fireEvent.click(screen.getByRole("button", { name: /Facts about/ }))
    expect(await screen.findByText("Moderate costs")).toBeTruthy()
    expect(screen.getByText("CS and IT")).toBeTruthy()
    expect(screen.getByText(/Verified/)).toBeTruthy()
  })
})
