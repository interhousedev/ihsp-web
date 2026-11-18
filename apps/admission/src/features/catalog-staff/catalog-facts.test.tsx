import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { Proposal } from "./api"
import { ProposalFacts } from "./components/proposal-facts"

const FACTS: NonNullable<Proposal["facts"]> = {
  "intl.test_required": { value: true, source_url: "https://example.edu/intl", year: 2025, note: null },
}

describe("proposal facts", () => {
  test("lists each fact with its year and a safe source link", async () => {
    server.use(http.get(apiUrl("/v1/admission/staff/catalog/fact-spec"), () => HttpResponse.json({ groups: [] })))
    renderAdmissionApp(<ProposalFacts facts={FACTS} />)
    expect(await screen.findByTestId("proposal-facts")).toBeTruthy()
    expect(screen.getByText(/2025/)).toBeTruthy()
    const link = screen.getByRole("link", { name: /example\.edu/ })
    expect(link.getAttribute("rel")).toBe("noopener noreferrer")
    expect(link.getAttribute("href")).toBe("https://example.edu/intl")
    fireEvent.focus(link)
  })
})
