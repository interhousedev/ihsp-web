/**
 * UF-ID-01: register with EMIS (fake EMIS) in three steps: EMIS credentials, profile + password + email, the code
 * from the mailbox (Mailpit). Then the new account logs in to the student app.
 */

import type { Page } from "@playwright/test"
import { FAKE_EMIS_PASSWORD, REGISTERED_PASSWORD } from "./fixtures/accounts"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { waitForCode } from "./fixtures/mailpit"
import {
  EMIS_CANDIDATES,
  clearRegistrationRateLimits,
  nextCandidateIndex,
  rememberCandidateUsed,
} from "./fixtures/registration"
import { a11y, expect, test } from "./fixtures/test"
import { heading } from "./fixtures/ui"

test.beforeAll(async () => {
  await clearRegistrationRateLimits()
})

/** Step 1 with the next unused fake-EMIS student; returns its EMIS login once the profile step shows. */
async function startRegistration(page: Page): Promise<string> {
  for (let index = nextCandidateIndex(); index < EMIS_CANDIDATES.length; index += 1) {
    const emisLogin = EMIS_CANDIDATES[index] ?? ""
    await page.goto(`${URLS.id}/register/`)
    await expect(heading(page, "Register with EMIS")).toBeVisible()
    await page.getByLabel("EMIS login", { exact: true }).fill(emisLogin)
    await page.getByLabel("EMIS password", { exact: true }).fill(FAKE_EMIS_PASSWORD)
    await page.getByRole("button", { name: "Continue" }).click()
    const profile = heading(page, "Is this you?")
    const taken = page.getByText(/already has an IHT account/)
    await expect(profile.or(taken)).toBeVisible()
    rememberCandidateUsed(index)
    if (await profile.isVisible()) return emisLogin
  }
  throw new Error("All fake EMIS students are registered: reset the dev database and seed again.")
}

test.describe("UF-ID-01 registration", () => {
  test("EMIS credentials are checked: a wrong password is refused", async ({ page, allowConsoleError }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one wrong attempt per run is enough (10 attempts per hour per IP)")
    allowConsoleError(/status of (401|422)/)
    await page.goto(`${URLS.id}/register/`)
    await page.getByLabel("EMIS login", { exact: true }).fill("student02")
    await page.getByLabel("EMIS password", { exact: true }).fill("not-the-password")
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByText("Wrong EMIS login or password.")).toBeVisible()
  })

  test("three steps create the account and the new student logs in", async ({ page, allowConsoleError }, testInfo) => {
    test.slow()
    // Fake-EMIS students that were registered before (409 `id/emis-already-linked`) are skipped.
    allowConsoleError(/status of 409/)
    await a11yOfStepOne(page, testInfo)
    const email = `e2e-${Date.now()}-${testInfo.project.name}@example.org`
    await startRegistration(page)

    // Step 2: the profile that EMIS returned, a password and a recovery email.
    await expect(heading(page, "Is this you?")).toBeVisible()
    const login = (
      await page
        .locator("dd")
        .filter({ hasText: /^[a-z]+\.[a-z]+/ })
        .first()
        .textContent()
    )?.trim()
    expect(login, "the generated login is shown on the profile card").toBeTruthy()
    await a11y(page, testInfo, { label: "register step 2" })
    await page.getByLabel("New password", { exact: true }).fill(REGISTERED_PASSWORD)
    await page.getByLabel("Repeat the password", { exact: true }).fill(REGISTERED_PASSWORD)
    await page.getByLabel("Recovery email", { exact: true }).fill(email)
    const since = Date.now()
    await page.getByRole("button", { name: "Send code to the email" }).click()

    // Step 3: the code that arrived in Mailpit.
    await expect(heading(page, "Confirm your email")).toBeVisible()
    const code = await waitForCode({ since, to: email })
    await page.getByLabel("Code", { exact: true }).fill(code)
    await page.getByRole("button", { name: "Create account" }).click()

    await expect(heading(page, "Account created")).toBeVisible()
    await expect(page.getByText(`Your login is ${login}`)).toBeVisible()
    await a11y(page, testInfo, { label: "register done" })

    // The new account works: log in to the student app with the new password.
    await loginAs(page, { login: login ?? "", password: REGISTERED_PASSWORD, role: "student", apps: ["sp"] }, "sp")
    await expect(heading(page, "Today")).toBeVisible()
  })
})

async function a11yOfStepOne(page: Page, testInfo: Parameters<typeof a11y>[1]): Promise<void> {
  await page.goto(`${URLS.id}/register/`)
  await expect(heading(page, "Register with EMIS")).toBeVisible()
  await a11y(page, testInfo, { label: "register step 1" })
}
