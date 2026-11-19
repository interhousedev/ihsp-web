import { screen } from "@testing-library/react"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { SettingsPage } from "./components/settings-page"

describe("settings profile tab", () => {
  test("?tab=profile selects the Profile tab", async () => {
    renderAdmissionApp(<SettingsPage />, {
      route: "/settings/?tab=profile",
      messages: { privacy: { view: { profile: "Profile" } } },
    })
    expect(await screen.findByRole("tab", { name: /Profile/, selected: true })).toBeInTheDocument()
  })
})
