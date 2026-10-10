/** The weekday toggles of a bell show a clear selected state; admin follows the theme of the account like other apps. */
import { describe, expect, test } from "bun:test"
import type { Bell } from "@ihsp/api"
import { ThemePreferenceSync } from "@ihsp/features-core"
import { adminMe, userPreferences } from "@ihsp/test-utils"
import { AppThemeProvider } from "@ihsp/ui"
import { screen, waitFor } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { BellRow } from "../features/terms/components/bell-row"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

const bell: Bell = {
  period: 1,
  start: "08:00",
  end: "08:45",
  weekdays: [1, 3],
  source: "manual",
} as Bell

describe("bell weekday toggles", () => {
  test("selected days are pressed and styled, the others are not", () => {
    renderAdmin(
      <ul>
        <BellRow bell={bell} onChange={() => undefined} onReset={() => undefined} onRemove={() => undefined} />
      </ul>,
    )
    const group = screen.getByRole("group")
    const buttons = Array.from(group.querySelectorAll("button"))
    const pressed = buttons.filter((button) => button.getAttribute("aria-pressed") === "true")
    expect(pressed).toHaveLength(2)
    expect(buttons).toHaveLength(5)
    for (const button of buttons) {
      const on = button.getAttribute("aria-pressed") === "true"
      expect(button.className.includes("aria-pressed:bg-primary")).toBe(true)
      expect(on).toBe(pressed.includes(button))
    }
  })
})

describe("admin theme", () => {
  test("providers mount the account theme sync inside the theme and auth providers", () => {
    const source = readFileSync(join(import.meta.dir, "..", "app", "providers.tsx"), "utf8")
    expect(source.indexOf("<AppThemeProvider>")).toBeLessThan(source.indexOf("<AuthProvider>"))
    expect(source.indexOf("<AuthProvider>")).toBeLessThan(source.indexOf("<ThemePreferenceSync>"))
  })

  test("a dark account preference makes the page dark", async () => {
    renderAdmin(
      <AppThemeProvider>
        <ThemePreferenceSync>
          <p>page</p>
        </ThemePreferenceSync>
      </AppThemeProvider>,
      { session: { user: { ...adminMe, preferences: { ...userPreferences, theme: "dark" } } } },
    )
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true))
  })
})
