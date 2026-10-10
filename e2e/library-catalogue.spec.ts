/**
 * The library app: the catalogue is open to visitors (browse, open an item, "Sign in" in the header), and a page that
 * needs an account sends a visitor to the login by itself and brings them back once signed in.
 */

import { LIBRARIAN } from "./fixtures/accounts"
import { URLS, origin } from "./fixtures/env"
import { ensureEnglish, submitLoginForm } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading } from "./fixtures/ui"

test("the catalogue is open to visitors: browse, open an item without a login", async ({ page }, testInfo) => {
  test.slow()
  await page.goto(`${URLS.library}/browse/`)
  await expect(heading(page, "Browse", 1)).toBeVisible()
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible()
  const results = page.getByRole("list", { name: "Search results" })
  await expect(results.getByRole("listitem").first()).toBeVisible({ timeout: 60_000 })
  await a11y(page, testInfo, { label: "library browse visitor" })

  await results.getByRole("listitem").first().getByRole("link").first().click()
  await expect(page).toHaveURL(new RegExp(`^${URLS.library}/item/\\?`))
  await expect(page.locator("main").first()).toBeVisible()
  await a11y(page, testInfo, { label: "library item visitor" })
  // A visitor never meets the login page while browsing.
  expect(new URL(page.url()).origin).toBe(origin(URLS.library))
})

test("a visitor who opens a page of the account is sent to the login and comes back", async ({ page }, testInfo) => {
  test.slow()
  await page.goto(`${URLS.library}/my/`)
  // No click: the auth guard starts the login by itself.
  await page.waitForURL((url) => url.origin === origin(URLS.id) && url.pathname.startsWith("/login"), {
    timeout: 90_000,
  })
  await a11y(page, testInfo, { label: "id login from library" })
  await submitLoginForm(page, LIBRARIAN)
  await page.waitForURL((url) => url.origin === origin(URLS.library) && url.pathname.startsWith("/my"), {
    timeout: 60_000,
  })
  await ensureEnglish(page)

  await expect(heading(page, "My library", 1)).toBeVisible()
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toHaveCount(0)
  await a11y(page, testInfo, { label: "library my signed in" })
})
