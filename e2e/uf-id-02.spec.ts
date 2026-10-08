/**
 * UF-ID-02: log in through the login app (Hydra), in every app, with the demo accounts.
 * Covers the PKCE round trip (`/auth/callback/`), the second factor of Administration, the role check and sign-out.
 */

import { ADMIN, STUDENT, TEACHER } from "./fixtures/accounts"
import { URLS, origin } from "./fixtures/env"
import { loginAs, submitLoginForm } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading, signOut } from "./fixtures/ui"

test.describe("UF-ID-02 login", () => {
  test("a student logs in to the student app through Hydra and lands on Today", async ({ page }, testInfo) => {
    await loginAs(page, STUDENT, "sp")
    await expect(page).toHaveURL(new RegExp(`^${URLS.sp}/`))
    await expect(heading(page, "Today")).toBeVisible()
    await a11y(page, testInfo, { label: "sp today" })

    // Single sign-on (ID-16): the login is remembered even without "Remember me", so the security pages (client `id`)
    // open at once, without a password and without a login page (uf-id-sso.spec.ts counts the pages).
    await page.goto(`${URLS.id}/security/`)
    await expect(heading(page, "Security")).toBeVisible({ timeout: 60_000 })
    await a11y(page, testInfo, { label: "id security" })
  })

  test("the session survives a reload (refresh cookie) and ends on sign-out", async ({ page }) => {
    await loginAs(page, STUDENT, "sp")
    await page.reload()
    await expect(page.locator("main").first()).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`^${URLS.sp}/`))

    await signOut(page)
    // Hydra's logout round trip ends on the login page of the id app (directly, or through the app, which asks to log in
    // again because the session is gone).
    await page.waitForURL((url) => url.origin === origin(URLS.id) && url.pathname.startsWith("/login"), {
      timeout: 60_000,
    })
    await expect(page.getByLabel("Login", { exact: true })).toBeVisible()
  })

  test("a wrong password is refused with a clear message; OTP login stays one click away", async ({
    page,
    allowConsoleError,
  }, testInfo) => {
    allowConsoleError(/status of 401/)
    await page.goto(`${URLS.sp}/`)
    await page.waitForURL((url) => url.origin === origin(URLS.id) && url.pathname.startsWith("/login"), {
      timeout: 90_000,
    })
    await expect(page.getByRole("link", { name: "Log in with OTP" })).toBeVisible()
    await a11y(page, testInfo, { label: "id login" })

    await submitLoginForm(page, { ...STUDENT, password: "Wrong-password-1" })
    await expect(page.getByText("Wrong login or password.")).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`^${URLS.id}/login`))
  })

  test("a teacher logs in to the staff app", async ({ page }, testInfo) => {
    await loginAs(page, TEACHER, "staff")
    await expect(page).toHaveURL(new RegExp(`^${URLS.staff}/`))
    await expect(heading(page, "Today")).toBeVisible()
    await a11y(page, testInfo, { label: "staff today" })
  })

  test("Administration needs the one-time code from the mailbox", async ({ page }, testInfo) => {
    await loginAs(page, ADMIN, "admin")
    await expect(page).toHaveURL(new RegExp(`^${URLS.admin}/`))
    await expect(page.locator("main").first()).toBeVisible()
    await a11y(page, testInfo, { label: "admin home" })
  })

  test("a student has no access to the staff app: the login page says so", async ({ page, allowConsoleError }) => {
    allowConsoleError(/status of (401|403)/)
    await page.goto(`${URLS.staff}/`)
    await page.waitForURL((url) => url.origin === origin(URLS.id) && url.pathname.startsWith("/login"), {
      timeout: 90_000,
    })
    await submitLoginForm(page, STUDENT)
    await expect(page.getByText(/don.t have access|no access/i)).toBeVisible()
    await expect(page.getByRole("link", { name: "Back to the app" })).toBeVisible()
  })
})
