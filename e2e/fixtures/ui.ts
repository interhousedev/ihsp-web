/** Small UI helpers shared by the specs (English UI: the suite runs with the `en-US` locale). */

import { expect, type Locator, type Page } from "@playwright/test"

/** The page title (`PageContainer` renders a heading). */
export function heading(page: Page, name: string | RegExp, level?: number): Locator {
  return page.getByRole("heading", { name, level })
}

/** Opens the account menu in the header and logs out. */
export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Account menu" }).click()
  await page.getByRole("menuitem", { name: "Log out" }).click()
}

/** Waits until the loading skeletons of a page are gone and its main area has content. */
export async function settled(page: Page): Promise<void> {
  await expect(page.locator("main").first()).toBeVisible()
  await page.waitForLoadState("networkidle").catch(() => undefined)
}

/** Toast (sonner) with this text. */
export function toast(page: Page, text: string | RegExp): Locator {
  return page.locator("[data-sonner-toast]").filter({ hasText: text }).first()
}
