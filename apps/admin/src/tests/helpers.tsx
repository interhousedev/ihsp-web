import { setDefaultTimeout } from "bun:test"
import {
  adminMe,
  renderWithProviders,
  type RenderWithProvidersOptions,
  type RenderWithProvidersResult,
} from "@ihsp/test-utils"
import { configure, fireEvent, screen, waitFor } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import type { ReactElement } from "react"
import en from "../../messages/en.json"
import ru from "../../messages/ru.json"
import uz from "../../messages/uz.json"

/**
 * Call once at the top of every test file. The first render of a page loads many modules and happy-dom is slow with
 * big pages, so tests and `findBy…` queries get more than the default 5 s and 1 s.
 */
export function configureTests(): void {
  setDefaultTimeout(30_000)
  configure({ asyncUtilTimeout: 10_000 })
}

export const messages = { en, ru, uz }

/**
 * Renders with the English messages of this app on top of the shared ones, as the demo administrator. The address
 * lives in memory (`hasMemory`), so pages that keep their state in the URL (`?tab=`, filters) react to their changes.
 */
export function renderAdmin(ui: ReactElement, options: RenderWithProvidersOptions = {}): RenderWithProvidersResult {
  const search = new URL(options.route ?? "/", "http://localhost:3000").search
  return renderWithProviders(
    <NuqsTestingAdapter hasMemory searchParams={search}>
      {ui}
    </NuqsTestingAdapter>,
    { messages: en, session: { user: adminMe }, ...options },
  )
}

/** Sets the value of a text field in one step (typing key by key is very slow in happy-dom). */
export function setValue(field: HTMLElement, value: string): void {
  fireEvent.change(field, { target: { value } })
}

/** Sets the viewport width the way `useIsMobile` reads it. */
export function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width })
  window.dispatchEvent(new Event("resize"))
}

/**
 * `waitFor` on a plain condition. A failing jest-dom matcher on a DOM element (`expect(button).toBeEnabled()` inside
 * `waitFor`) makes bun hang while it formats the element, so waits check booleans and assert afterwards.
 */
export function waitUntil(condition: () => boolean, message = "condition not met"): Promise<void> {
  return waitFor(() => {
    if (!condition()) throw new Error(message)
  })
}

/**
 * The `href` of a link with the trailing slash of the path restored: `next/link` drops it before `?` in tests (the
 * static export has `trailingSlash: true`, so the real pages keep it).
 */
export function hrefOf(element: Element | null): string {
  const href = element?.getAttribute("href") ?? ""
  return href.startsWith("/") ? href.replace(/([^/])(\?|#|$)/, "$1/$2") : href
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

/** "October 2026" (the label of the calendar grid) as a month number counted from year 0. */
function monthNumber(label: string): number {
  const [name = "", year = "0"] = label.split(" ")
  return Number(year) * 12 + MONTH_NAMES.indexOf(name)
}

/**
 * Opens a `DatePicker`, pages its calendar to the month of `iso` (it opens in the current month) and clicks the day.
 * The popover is closed again (Escape would close the dialog around it too), so the next picker starts clean.
 */
export async function pickDate(user: UserEvent, trigger: HTMLElement, iso: string): Promise<void> {
  await user.click(trigger)
  const [year = 0, month = 1] = iso.split("-").map(Number)
  const target = year * 12 + (month - 1)
  let grid = await screen.findByRole("grid")
  for (let step = 0; step < 48 && monthNumber(grid.getAttribute("aria-label") ?? "") !== target; step += 1) {
    const forward = monthNumber(grid.getAttribute("aria-label") ?? "") < target
    await user.click(
      screen.getByRole("button", { name: forward ? "Go to the Next Month" : "Go to the Previous Month" }),
    )
    grid = await screen.findByRole("grid")
  }
  const day = grid.querySelector(`td[data-day="${iso}"] button`)
  if (!day) throw new Error(`The calendar has no enabled day ${iso}`)
  await user.click(day)
  await user.click(trigger)
  await waitFor(() => {
    if (screen.queryByRole("grid")) throw new Error("the calendar is still open")
  })
}
