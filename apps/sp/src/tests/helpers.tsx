import { setDefaultTimeout, setSystemTime } from "bun:test"
import {
  FIXTURE_NOW,
  renderWithProviders,
  userMe,
  userPreferences,
  type RenderWithProvidersOptions,
  type RenderWithProvidersResult,
} from "@ihsp/test-utils"
import type { UserPreferences } from "@ihsp/api"
import { configure, fireEvent, screen } from "@testing-library/react"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import type { ReactElement } from "react"
import en from "../../messages/en.json"
import ru from "../../messages/ru.json"
import uz from "../../messages/uz.json"

/**
 * Call once at the top of every test file. The first render of a page loads a lot of modules and happy-dom is slow
 * with big pages, so tests and `findBy…` queries get more than the default 5 s and 1 s.
 */
export function configureTests(): void {
  setDefaultTimeout(20_000)
  configure({ asyncUtilTimeout: 10_000 })
}

export const messages = { en, ru, uz }

/**
 * Renders with the English messages of this app on top of the shared ones, as the demo student. The address lives in
 * memory (`hasMemory`), so pages that keep their state in the URL (`?tab=`, `?week=`) react to their own changes.
 */
export function renderSp(ui: ReactElement, options: RenderWithProvidersOptions = {}): RenderWithProvidersResult {
  const search = new URL(options.route ?? "/", "http://localhost:3000").search
  return renderWithProviders(
    <NuqsTestingAdapter hasMemory searchParams={search}>
      {ui}
    </NuqsTestingAdapter>,
    { messages: en, ...options },
  )
}

/** The demo student with some preferences changed. */
export function studentWith(preferences: Partial<UserPreferences>): NonNullable<RenderWithProvidersOptions["session"]> {
  return { user: { ...userMe, preferences: { ...userPreferences, ...preferences } } }
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

/**
 * The card (a `<section>`) that has a title matching `title`. Looking the title up by text is much faster than
 * `getByRole("region", { name })`, which computes the accessible name of every region on a big page.
 */
export async function findCard(title: string | RegExp): Promise<HTMLElement> {
  const heading = await screen.findByText(title)
  const section = heading.closest("section")
  if (!section) throw new Error(`"${String(title)}" is not inside a section`)
  return section
}

export function queryCard(title: string | RegExp): HTMLElement | null {
  return screen.queryByText(title)?.closest("section") ?? null
}

/** Sets the value of a text field in one step (typing key by key is very slow in happy-dom). */
export function setValue(field: HTMLElement, value: string): void {
  fireEvent.change(field, { target: { value } })
}
