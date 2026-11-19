/** SP-UX-a3, SP-UX-a4: the tour waits for the onboarding gate, and the connect-AI promo waits for the tour. */
import { beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server, setOnboarding, userMe, userPreferences } from "@ihsp/test-utils"
import { resetTourState } from "@ihsp/features-core"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ShellTour } from "../features/shell/components/sp-shell"
import { ConnectAiNotice } from "../features/today/dashboard/connect-ai-notice"
import { configureTests, renderSp } from "./helpers"

configureTests()
beforeEach(resetTourState)

const fresh = { user: { ...userMe, preferences: { ...userPreferences, onboarding_dismissed: [] as string[] } } }
const seen = { user: { ...userMe, preferences: { ...userPreferences, onboarding_dismissed: ["tour"] } } }

describe("overlay order", () => {
  test("SP-UX-a3: no tour while the gate is incomplete; it starts once the gate completes", async () => {
    setOnboarding({ selfieDone: false, certificatesDone: false })
    const { queryClient } = renderSp(<ShellTour />, { session: fresh })

    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    setOnboarding({ selfieDone: true, certificatesDone: true })
    await queryClient.invalidateQueries()

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  test("SP-UX-a4: the connect-AI promo is hidden while the tour is pending and shows once it is dismissed", async () => {
    server.use(
      http.get(apiUrl("/v1/me/alerts"), () =>
        HttpResponse.json([{ kind: "connect_ai", params: {}, action_url: "https://id.example.test/c/" }]),
      ),
    )
    const pending = renderSp(<ConnectAiNotice />, { session: fresh })
    await waitFor(() => expect(pending.queryClient.isFetching()).toBe(0))
    expect(screen.queryByText(/Connect my AI/)).not.toBeInTheDocument()
    pending.unmount()

    renderSp(<ConnectAiNotice />, { session: seen })
    expect(await screen.findByText(/Connect my AI/)).toBeInTheDocument()
  })
})
