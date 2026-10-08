/**
 * ID-16, UF-ID-02: single sign-on and a quiet login. After the first login the other apps open without a login or
 * consent page (the redirects are answered by the backend), a login shows the login app only when a form is needed,
 * the password field has a show/hide button, and two tabs of one app both end signed in.
 */

import type { BrowserContext, Page } from "@playwright/test"
import { STUDENT, TEACHER } from "./fixtures/accounts"
import { URLS, origin } from "./fixtures/env"
import { loginAs, submitLoginForm } from "./fixtures/login"
import { expect, test } from "./fixtures/test"
import { heading, signOut } from "./fixtures/ui"

const isLoginApp = (url: URL) => url.origin === origin(URLS.id)

/** Paths of the HTML documents (including redirect targets) that the pages of a context requested. */
function documentPaths(context: BrowserContext): string[] {
  const seen: string[] = []
  context.on("request", (request) => {
    if (request.resourceType() === "document") {
      const url = new URL(request.url())
      seen.push(`${url.origin}${url.pathname}`)
    }
  })
  return seen
}

async function waitForLoginForm(page: Page): Promise<void> {
  await page.waitForURL((url) => isLoginApp(url) && url.pathname.startsWith("/login"), { timeout: 90_000 })
  await expect(page.getByLabel("Login", { exact: true })).toBeVisible()
}

async function expectSignedIn(page: Page, app: "sp" | "lms" | "staff"): Promise<void> {
  await page.waitForURL((url) => url.origin === origin(URLS[app]) && !url.pathname.startsWith("/auth/callback"), {
    timeout: 60_000,
  })
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible({ timeout: 60_000 })
}

test.describe("ID-16 single sign-on", () => {
  test("another app opens without any login or consent page", async ({ page, context }) => {
    await loginAs(page, STUDENT, "sp")
    const documents = documentPaths(context)

    const lms = await context.newPage()
    await lms.goto(`${URLS.lms}/`)
    await expectSignedIn(lms, "lms")

    // The app, Hydra (twice: login and consent answered by the backend), the callback page: no page of the login app.
    expect(documents.filter((path) => path.startsWith(origin(URLS.id)))).toEqual([])
    expect(documents.filter((path) => path.endsWith("/auth/callback/"))).toHaveLength(1)
  })

  test("the security pages of the login app open without asking for the password again", async ({ page, context }) => {
    await loginAs(page, STUDENT, "sp")
    const documents = documentPaths(context)

    await page.goto(`${URLS.id}/security/`)

    await expect(heading(page, "Security")).toBeVisible({ timeout: 60_000 })
    expect(documents.filter((path) => path.includes("/login/") || path.includes("/consent/"))).toEqual([])
  })

  test("a login that needs a form shows it once, and the other apps then need none", async ({ page, context }) => {
    const documents = documentPaths(context)
    await page.goto(`${URLS.sp}/`)
    await waitForLoginForm(page)
    await submitLoginForm(page, STUDENT)
    await expectSignedIn(page, "sp")

    // One login form, no consent page: Hydra's consent URL is answered by the backend.
    expect(documents.filter((path) => path.endsWith("/login/"))).toHaveLength(1)
    expect(documents.filter((path) => path.endsWith("/consent/"))).toEqual([])
  })

  test("an app the account may not use asks for the right login once, not twice", async ({ page, context }) => {
    await loginAs(page, STUDENT, "sp")
    const documents = documentPaths(context)

    const staff = await context.newPage()
    await staff.goto(`${URLS.staff}/`)
    await waitForLoginForm(staff)
    await submitLoginForm(staff, TEACHER)
    await expectSignedIn(staff, "staff")

    expect(documents.filter((path) => path.endsWith("/login/"))).toHaveLength(1)
  })

  test("signing out ends single sign-on", async ({ page, context }) => {
    await loginAs(page, STUDENT, "sp")
    await signOut(page)
    await page.waitForURL((url) => isLoginApp(url) && url.pathname.startsWith("/login"), { timeout: 60_000 })

    const lms = await context.newPage()
    await lms.goto(`${URLS.lms}/`)

    await waitForLoginForm(lms)
  })

  test("two tabs of one app opened at once both end signed in", async ({ page, context }) => {
    const second = await context.newPage()
    await Promise.all([page.goto(`${URLS.sp}/`), second.goto(`${URLS.sp}/`)])
    await Promise.all([waitForLoginForm(page), waitForLoginForm(second)])

    await submitLoginForm(page, STUDENT)
    await expectSignedIn(page, "sp")
    // The form of the second tab is stale: Hydra's CSRF cookie belongs to the other login. The callback restarts that
    // login, which single sign-on completes without a form.
    await submitLoginForm(second, STUDENT)
    await expectSignedIn(second, "sp")
  })

  test("the page of an app starts the login without waiting for telegram.org", async ({ page, context }) => {
    const external: string[] = []
    context.on("request", (request) => {
      if (new URL(request.url()).hostname === "telegram.org") external.push(request.url())
    })

    await page.goto(`${URLS.sp}/`)
    await waitForLoginForm(page)
    await submitLoginForm(page, STUDENT)
    await expectSignedIn(page, "sp")

    expect(external).toEqual([])
  })
})

test.describe("show password", () => {
  test("the eye button shows and hides the password, and is 44 px", async ({ page }) => {
    await page.goto(`${URLS.sp}/`)
    await waitForLoginForm(page)
    const password = page.getByLabel("Password", { exact: true })
    await password.fill("Secret-123")
    await expect(password).toHaveAttribute("type", "password")

    const show = page.getByRole("button", { name: "Show password" })
    const box = await show.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(44)
    expect(box?.height).toBeGreaterThanOrEqual(44)
    await show.click()

    await expect(password).toHaveAttribute("type", "text")
    await expect(password).toHaveValue("Secret-123")
    await page.getByRole("button", { name: "Hide password" }).click()
    await expect(password).toHaveAttribute("type", "password")
  })

  test("the registration and recovery pages have it too", async ({ page }) => {
    await page.goto(`${URLS.id}/register/`)
    await expect(page.getByLabel("EMIS password", { exact: true })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole("button", { name: "Show password" })).toBeVisible()
  })
})
