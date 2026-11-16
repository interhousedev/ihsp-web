import { describe, expect, it } from "bun:test"
import { screen, waitFor } from "@testing-library/react"
import { apiUrl, server } from "@ihsp/test-utils"
import { http, HttpResponse } from "msw"
import { renderAdmissionApp } from "../../../tests/helpers"
import { VoiceAnswer } from "./voice-answer"

function grants(active: boolean) {
  server.use(
    http.get(apiUrl("/v1/admission/consent"), () =>
      HttpResponse.json({
        grants: [
          {
            purpose: "admission_ai",
            active,
            given_at: "2026-01-01T00:00:00Z",
            withdrawn_at: null,
          },
        ],
      }),
    ),
  )
}

describe("ADM career voice", () => {
  it("offers recording when admission_ai is granted", async () => {
    grants(true)
    renderAdmissionApp(<VoiceAnswer questionId="question" disabled={false} onText={() => {}} />)
    expect(screen.queryByRole("checkbox")).toBeNull()
    const button = await screen.findByRole("button", { name: "Record answer" })
    await waitFor(() => expect(button).toBeEnabled())
  })
  it("disables recording with a hint without consent", async () => {
    grants(false)
    renderAdmissionApp(<VoiceAnswer questionId="question" disabled={false} onText={() => {}} />)
    expect(await screen.findByRole("button", { name: "Record answer" })).toBeDisabled()
    expect(await screen.findByText(/AI consent/)).toBeTruthy()
  })
  it("keeps recording disabled during another operation", async () => {
    grants(true)
    renderAdmissionApp(<VoiceAnswer questionId="question" disabled onText={() => {}} />)
    expect(await screen.findByRole("button", { name: "Record answer" })).toBeDisabled()
  })
})
