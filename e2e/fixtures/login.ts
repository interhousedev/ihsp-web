/**
 * Real login through Hydra: open an app, get redirected to the login app, type the credentials (Administration also
 * types the one-time code it finds in Mailpit), come back to the app signed in.
 */

import { expect, type Page } from "@playwright/test"
import type { Account } from "./accounts"
import { api } from "./api"
import { URLS, origin, type AppKey } from "./env"
import { waitForCode } from "./mailpit"

export type LoginOptions = {
  /** Path (with query) to open in the app; defaults to its home page. */
  path?: string
  /** The one-time code, when the caller already knows it (otherwise it is read from Mailpit). */
  otpCode?: string
}

/** Fills the login form of the login app and submits it; handles the second factor of Administration. */
export async function submitLoginForm(page: Page, account: Account, options: { otpCode?: string } = {}): Promise<void> {
  const since = Date.now()
  await page.getByLabel("Login", { exact: true }).fill(account.login)
  await page.getByLabel("Password", { exact: true }).fill(account.password)
  await page.getByRole("button", { name: "Log in", exact: true }).click()

  if (account.role === "admin") {
    await expect(page.getByRole("heading", { name: "Enter the code" })).toBeVisible()
    const code = options.otpCode ?? (await waitForCode({ since, to: account.email }))
    await page.getByLabel("Code", { exact: true }).fill(code)
    await page.getByRole("button", { name: "Confirm", exact: true }).click()
  }
}

/** Opens `app`, logs in as `account` through the login app and waits until the app shows its signed-in shell. */
export async function loginAs(page: Page, account: Account, app: AppKey, options: LoginOptions = {}): Promise<void> {
  const appOrigin = origin(URLS[app])
  await page.goto(`${URLS[app]}${options.path ?? "/"}`)
  // The app has no session: it starts the PKCE flow and Hydra sends the browser to the login page of the id app.
  await page.waitForURL((url) => url.origin === origin(URLS.id) && url.pathname.startsWith("/login"), {
    timeout: 90_000,
  })
  await submitLoginForm(page, account, options)
  await page.waitForURL((url) => url.origin === appOrigin && !url.pathname.startsWith("/auth/callback"), {
    timeout: 60_000,
  })
  await expect(page.locator("main").first()).toBeVisible()
  await ensureEnglish(page)
}

/**
 * The account preference wins over the browser language, and the seed creates the demo accounts with `ru`. The specs
 * read English texts, so the first login of an account switches its preference to `en` (it is stored in the account;
 * later logins start in English) and reloads the page.
 */
export async function ensureEnglish(page: Page): Promise<void> {
  const me = await api<{ preferences: { locale: string } }>(page, "GET", "/v1/id/me")
  if (me.preferences.locale === "en") return
  await api(page, "PATCH", "/v1/id/me/preferences", { locale: "en" })
  await page.reload()
  await expect(page.locator("main").first()).toBeVisible()
}
