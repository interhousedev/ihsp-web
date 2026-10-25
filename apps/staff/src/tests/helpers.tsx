import { setDefaultTimeout, setSystemTime } from "bun:test"
import type { UserMe, UserPreferences } from "@ihsp/api"
import {
  FIXTURE_NOW,
  renderWithProviders,
  teacherMe,
  userPreferences,
  type RenderWithProvidersOptions,
  type RenderWithProvidersResult,
} from "@ihsp/test-utils"
import { configure, fireEvent } from "@testing-library/react"
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
  setDefaultTimeout(20_000)
  configure({ asyncUtilTimeout: 10_000 })
}

export const messages = { en, ru, uz }

/** The demo teacher (Kalandarova, curator of 2TN2) with some preferences changed. */
export function teacherWith(
  changes: { preferences?: Partial<UserPreferences>; user?: Partial<UserMe> } = {},
): NonNullable<RenderWithProvidersOptions["session"]> {
  return {
    user: {
      ...teacherMe,
      ...changes.user,
      preferences: { ...userPreferences, ...changes.preferences },
    },
  }
}

/**
 * Renders with the English messages of this app on top of the shared ones, as the demo teacher. The address lives in
 * memory (`hasMemory`), so pages that keep their state in the URL (`?week=`, `?view=`) react to their own changes.
 */
export function renderStaff(ui: ReactElement, options: RenderWithProvidersOptions = {}): RenderWithProvidersResult {
  const search = new URL(options.route ?? "/", "http://localhost:3000").search
  return renderWithProviders(
    <NuqsTestingAdapter hasMemory searchParams={search}>
      {ui}
    </NuqsTestingAdapter>,
    { messages: en, session: teacherWith(), ...options },
  )
}

/** Freezes `Date` at the fixture time (Wednesday 2026-10-07 10:12 in Tashkent); call `unfreezeTime` afterwards. */
export function freezeTime(): void {
  setSystemTime(new Date(FIXTURE_NOW))
}

export function unfreezeTime(): void {
  setSystemTime()
}

/** Sets the viewport width the way `useIsMobile` reads it. */
export function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width })
  window.dispatchEvent(new Event("resize"))
}

/** Sets the value of a text field in one step (typing key by key is very slow in happy-dom). */
export function setValue(field: HTMLElement, value: string): void {
  fireEvent.change(field, { target: { value } })
}

/**
 * The `href` of a link with the trailing slash of the path restored: `next/link` drops it before `?` in tests (the
 * static export has `trailingSlash: true`, so the real pages keep it).
 */
export function hrefOf(element: Element | null): string {
  const href = element?.getAttribute("href") ?? ""
  return href.startsWith("/") ? href.replace(/([^/])(\?|#|$)/, "$1/$2") : href
}
