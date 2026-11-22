/** The "Block unnecessary tracking and analytics" switch of the security page (`preferences.limit_ai_tracing`). */
import { describe, expect, test } from "bun:test"
import { apiUrl, server, userMe, userPreferences } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { SecurityPage } from "@ihsp/features-core/id-account"
import { allowSlowTests, renderId } from "./helpers"

allowSlowTests()

function recordPatches(): Record<string, unknown>[] {
  const bodies: Record<string, unknown>[] = []
  server.use(
    http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      bodies.push(body)
      return HttpResponse.json({ ...userPreferences, ...body })
    }),
  )
  return bodies
}

describe("AI tracing switch", () => {
  test("is off by default, explains itself and saves the choice", async () => {
    const bodies = recordPatches()
    const { user } = renderId(<SecurityPage />, { route: "/security/", session: { user: userMe } })

    const toggle = await screen.findByRole("switch", { name: /Block unnecessary tracking and analytics/ })
    expect(toggle).not.toBeChecked()
    expect(screen.getByText(/Essays are never recorded/)).toBeInTheDocument()

    await user.click(toggle)

    await waitFor(() => expect(bodies).toEqual([{ limit_ai_tracing: true }]))
    await waitFor(() => expect(toggle).toBeChecked())
  })

  test("shows the saved choice", async () => {
    server.use(
      http.get(apiUrl("/v1/id/me"), () =>
        HttpResponse.json({ ...userMe, preferences: { ...userPreferences, limit_ai_tracing: true } }),
      ),
    )
    renderId(<SecurityPage />, { route: "/security/", session: { user: userMe } })

    expect(await screen.findByRole("switch", { name: /Block unnecessary tracking/ })).toBeChecked()
  })
})
