import { describe, expect, it } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { renderAdmissionApp } from "../../../tests/helpers"
import type { Question } from "../types"
import { QuestionField } from "./question-field"

const question = { id: "q3", section: "where", kind: "country", required: true, options: [] } as unknown as Question

function config(available: string[]) {
  server.use(
    http.get(apiUrl("/v1/admission/config"), () =>
      HttpResponse.json({ questions: [], options: { countries: ["GB", "FR"], countries_available: available } }),
    ),
  )
}

describe("country question", () => {
  it("lists every country, disabling the ones without a university", async () => {
    config(["GB"])
    renderAdmissionApp(<QuestionField question={question} value={[]} onChange={() => {}} />)
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "France" } })
    const france = await screen.findByRole("button", { name: /France/ })
    expect(france).toBeDisabled()
    expect(france.textContent).toContain("No universities yet")
    fireEvent.change(input, { target: { value: "United" } })
    expect(await screen.findByRole("button", { name: /United Kingdom/ })).not.toBeDisabled()
  })
})
