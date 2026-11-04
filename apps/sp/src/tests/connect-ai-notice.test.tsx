/** MCP-5: the Today page offers the AI wizard to a student without a connected client; dismissing hides it. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ConnectAiNotice } from "../features/today/dashboard/connect-ai-notice"
import { configureTests, renderSp } from "./helpers"

configureTests()

const CONNECT_ALERT = { kind: "connect_ai", params: {}, action_url: "https://id.example.test/connectors/new/" }

function alertsWith(alerts: unknown[]) {
  server.use(http.get(apiUrl("/v1/me/alerts"), () => HttpResponse.json(alerts)))
}

describe("connect my AI notice", () => {
  test("names the app from its brand and links to the setup wizard", async () => {
    alertsWith([CONNECT_ALERT])
    renderSp(<ConnectAiNotice />)

    expect(await screen.findByText("Connect my AI to my.iht")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: "Set up an AI app" })
    expect(link.getAttribute("href")).toBe(CONNECT_ALERT.action_url)
  })

  test("is absent when the student already has a connected client", async () => {
    alertsWith([])
    renderSp(<ConnectAiNotice />)

    await waitFor(() => expect(screen.queryByText(/Connect my AI/)).not.toBeInTheDocument())
  })

  test("dismissing stores the notice as dismissed and hides it", async () => {
    let saved: unknown = null
    alertsWith([CONNECT_ALERT])
    server.use(
      http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
        saved = await request.json()
        return HttpResponse.json({})
      }),
    )
    const { user } = renderSp(<ConnectAiNotice />)

    await user.click(await screen.findByRole("button", { name: "Not now" }))

    await waitFor(() => expect(saved).toMatchObject({ onboarding_dismissed: expect.arrayContaining(["connect_ai"]) }))
    await waitFor(() => expect(screen.queryByText(/Connect my AI/)).not.toBeInTheDocument())
  })
})
