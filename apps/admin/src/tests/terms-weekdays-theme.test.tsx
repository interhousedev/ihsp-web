/** Admin follows the theme of the account like other apps. */
import { describe, expect, test } from "bun:test"
import { ThemePreferenceSync } from "@ihsp/features-core"
import { adminMe, userPreferences } from "@ihsp/test-utils"
import { AppThemeProvider } from "@ihsp/ui"
import { waitFor } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

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
