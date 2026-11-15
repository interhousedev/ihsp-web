import { beforeEach, describe, expect, it } from "bun:test"
import { renderWithProviders, userMe, userPreferences } from "@ihsp/test-utils"
import { getSession } from "@ihsp/auth"
import { act, screen, waitFor } from "@testing-library/react"
import { OnboardingTour } from "./onboarding-tour"
import { resetTourState } from "./tour-store"
import { replayOnboardingTour } from "./use-onboarding-tour"

const fresh = { ...userMe, preferences: { ...userPreferences, onboarding_dismissed: [] } }
const seen = { ...userMe, preferences: { ...userPreferences, onboarding_dismissed: ["tour"] } }
const tour = (
  <OnboardingTour variant="student" settingsHref="/settings/" connectAiHref="http://id.test/connectors/new/" />
)

describe("OnboardingTour", () => {
  beforeEach(resetTourState)

  it("opens on the first visit and walks through its steps", async () => {
    const { user } = renderWithProviders(tour, { session: { user: fresh } })

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    while (screen.queryByRole("button", { name: "Next" })) {
      await user.click(screen.getByRole("button", { name: "Next" }))
    }
    expect(screen.getByRole("link", { name: /Connect your AI/ })).toHaveAttribute(
      "href",
      "http://id.test/connectors/new/",
    )
    await user.click(screen.getByRole("button", { name: "Get started" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("remembers the dismissal in the preferences and does not open again", async () => {
    const { user } = renderWithProviders(tour, { session: { user: fresh } })
    await screen.findByRole("dialog")

    await user.click(screen.getByRole("button", { name: "Skip the tour" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(getSession()?.user.preferences.onboarding_dismissed).toContain("tour")
  })

  it("stays closed once dismissed, and opens again on replay", async () => {
    renderWithProviders(tour, { session: { user: seen } })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    act(() => replayOnboardingTour())

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("closing the dialog sets the tour aside; the pill resumes it at the same step and End dismisses it", async () => {
    const { user } = renderWithProviders(tour, { session: { user: fresh } })
    await screen.findByRole("dialog")
    await user.click(screen.getByRole("button", { name: "Next" }))

    await user.keyboard("{Escape}")

    const pill = await screen.findByRole("region", { name: "Welcome tour" })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(getSession()?.user.preferences.onboarding_dismissed).not.toContain("tour")
    await user.click(screen.getByRole("button", { name: "Back to tour" }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(/Step 2 of \d+/)).toBeInTheDocument()
    expect(pill).not.toBeInTheDocument()

    await user.keyboard("{Escape}")
    await user.click(await screen.findByRole("button", { name: "End" }))
    await waitFor(() => expect(getSession()?.user.preferences.onboarding_dismissed).toContain("tour"))
    expect(screen.queryByRole("region", { name: "Welcome tour" })).not.toBeInTheDocument()
  })
})
