/**
 * The `test` every spec imports. On top of Playwright's it
 *  - fails a test on console errors, uncaught page errors and Content-Security-Policy violations of any page it
 *    opened (`allowConsoleError` declares the errors a test provokes on purpose),
 *  - offers `a11y(page)`: an axe check (WCAG 2.1 A/AA) that fails on serious and critical violations.
 */

import { AxeBuilder } from "@axe-core/playwright"
import { expect, test as base, type BrowserContext, type Page, type TestInfo } from "@playwright/test"
import { trackToken } from "./api"

type Collected = { errors: string[]; allowed: RegExp[] }

/** Browser noise that is not a defect of the apps. */
const IGNORED: RegExp[] = [
  // next-themes renders its (inert) init script inside a client component; React 19 warns about it once per page in
  // development builds only. The apps ship their own init script in the layout head.
  /Encountered a script tag while rendering React component/,
  // Next.js dev server.
  /\[HMR\]|webpack-hmr|__nextjs_original-stack|Download the React DevTools/,
  /\/favicon\.ico/,
  // A page that has no session yet asks for a refresh token it does not have: the expected 401 of the bootstrap.
  /Failed to load resource: the server responded with a status of 401[\s\S]*\/v1\/oauth\/refresh/,
]

function describeMessage(page: Page, text: string, url: string | undefined): string {
  return `[${new URL(page.url() || "about:blank", "about:blank").pathname}] ${text}${url ? ` (${url})` : ""}`
}

/** Watches one page: console errors, page errors and CSP violations are collected into `collected`. */
export async function watchPage(page: Page, collected: Collected): Promise<void> {
  trackToken(page)
  page.on("console", (message) => {
    if (message.type() !== "error") return
    const url = message.location().url
    // Chromium reports a failed request as "Failed to load resource" without the URL in the text.
    const text = `${message.text()}${url ? ` ${url}` : ""}`
    if (IGNORED.some((pattern) => pattern.test(text))) return
    collected.errors.push(describeMessage(page, message.text(), url))
  })
  page.on("pageerror", (error) => {
    collected.errors.push(describeMessage(page, `Uncaught: ${error.message}`, undefined))
  })
  await page.exposeFunction("__ihspCsp", (violation: string) => {
    collected.errors.push(describeMessage(page, `CSP violation: ${violation}`, undefined))
  })
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      const report = (window as unknown as { __ihspCsp?: (value: string) => void }).__ihspCsp
      report?.(`${event.violatedDirective} blocked ${event.blockedURI}`)
    })
  })
}

/** Watches every page of a context opened later (for specs that create their own contexts, e.g. a second user). */
export async function watchContext(context: BrowserContext, collected: Collected): Promise<void> {
  await Promise.all(context.pages().map((page) => watchPage(page, collected)))
  context.on("page", (page) => {
    // `exposeFunction` and the init script must be in place before the page navigates; a new tab starts blank.
    void watchPage(page, collected).catch((error: unknown) => {
      collected.errors.push(`Could not watch a new page: ${String(error)}`)
    })
  })
}

type Fixtures = {
  /** Declares console errors a test causes on purpose (a wrong password answers 401, …). */
  allowConsoleError: (pattern: RegExp) => void
  /** Console/CSP collector shared by the pages of the test. */
  collected: Collected
  /** Opens an extra browser context (another user) whose pages are guarded the same way. */
  newGuardedContext: () => Promise<BrowserContext>
}

export const test = base.extend<Fixtures>({
  collected: async ({ context }, provide) => {
    const collected: Collected = { errors: [], allowed: [] }
    await watchContext(context, collected)
    await provide(collected)
    const unexpected = collected.errors.filter((line) => !collected.allowed.some((pattern) => pattern.test(line)))
    expect(unexpected, "console errors, page errors and CSP violations").toEqual([])
  },
  page: async ({ page, collected }, provide) => {
    void collected
    await provide(page)
  },
  allowConsoleError: async ({ collected }, provide) => {
    await provide((pattern) => {
      collected.allowed.push(pattern)
    })
  },
  newGuardedContext: async ({ browser, collected }, provide, testInfo) => {
    const contexts: BrowserContext[] = []
    await provide(async () => {
      const { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, locale, timezoneId } = testInfo.project.use
      const context = await browser.newContext({
        viewport,
        userAgent,
        isMobile,
        hasTouch,
        deviceScaleFactor,
        locale,
        timezoneId,
        serviceWorkers: "block",
      })
      await watchContext(context, collected)
      contexts.push(context)
      return context
    })
    await Promise.all(contexts.map((context) => context.close()))
  },
})

export { expect }

/** Serious and critical axe violations fail; the full result is attached to the report. */
export async function a11y(
  page: Page,
  testInfo: TestInfo,
  options: { label?: string; exclude?: string[]; disableRules?: string[] } = {},
): Promise<void> {
  // Buttons fade between states (`transition-all`): measure colors after the data and the transitions have settled.
  await page.waitForLoadState("networkidle").catch(() => undefined)
  await page.waitForTimeout(400)
  const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  // The Next.js dev overlay is not part of the product.
  builder.exclude("nextjs-portal")
  for (const selector of options.exclude ?? []) builder.exclude(selector)
  if (options.disableRules) builder.disableRules(options.disableRules)
  const results = await builder.analyze()
  const label = options.label ?? new URL(page.url()).pathname
  await testInfo.attach(`axe ${label}`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: "application/json",
  })
  const blocking = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => ({
      rule: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.slice(0, 3).map((node) => `${node.target.join(" ")}  ${node.html.slice(0, 220)}`),
    }))
  expect(blocking, `axe violations on ${label}`).toEqual([])
}
