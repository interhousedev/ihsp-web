import { describe, expect, test } from "bun:test"
import { server } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { HelperSearch } from "../features/help/components/helper-search"
import { validateProofUrl } from "../features/help/lib/proof-url"
import { helpHandlers, helperQueries } from "../features/help/testing/handlers"
import { renderAdmissionApp } from "./helpers"

describe("validateProofUrl", () => {
  test("accepts a plain https URL", () => {
    expect(validateProofUrl("https://example.com/portfolio")).toBeNull()
  })
  test.each([
    ["", "empty"],
    ["http://example.com", "scheme"],
    ["javascript:alert(1)", "scheme"],
    ["not a url", "malformed"],
    [`https://example.com/${"a".repeat(3000)}`, "length"],
    ["https://example.com:8443/x", "port"],
    ["https://user:pw@example.com/", "scheme"],
    ["https://localhost/x", "host"],
    ["https://127.0.0.1/x", "host"],
  ])("rejects %s", (value, problem) => {
    expect(validateProofUrl(value)).not.toBeNull()
    expect(validateProofUrl(value)).toBe(problem as never)
  })
})

describe("HelperSearch", () => {
  test("searches only from three characters", async () => {
    server.use(...helpHandlers())
    helperQueries.length = 0
    renderAdmissionApp(<HelperSearch onPick={() => {}} />)
    const input = screen.getByRole("combobox")
    fireEvent.change(input, { target: { value: "ma" } })
    expect(helperQueries).toEqual([])
    fireEvent.change(input, { target: { value: "mad" } })
    expect(await screen.findByText("Madina Yusupova")).toBeInTheDocument()
    expect(helperQueries).toEqual(["mad"])
  })
})
