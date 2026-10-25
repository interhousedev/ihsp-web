import { setDefaultTimeout } from "bun:test"
import { renderWithProviders, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import { configure, fireEvent, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import enMessages from "../../messages/en.json"

/**
 * happy-dom renders the Base UI components slowly, so the default 5 s test timeout is too tight for multi-step flows.
 * Call it at the top of every test file: `bun test` runs all files in one process and evaluates this module only once,
 * so a call at module level here would apply to the first file only.
 */
export function allowSlowTests(): void {
  setDefaultTimeout(60_000)
  configure({ asyncUtilTimeout: 8000 })
}

/** `renderWithProviders` with the id app's English messages; an anonymous visitor unless `session` says otherwise. */
export function renderId(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  return renderWithProviders(ui, { messages: enMessages, session: null, ...options })
}

/** A logged-in user of the demo world (the default student). */
export const LOGGED_IN = {}

/** Sets a field the way a keystroke would, but in one event (typing character by character is very slow in happy-dom). */
export async function fillField(label: string | RegExp, value: string): Promise<void> {
  fireEvent.change(await screen.findByLabelText(label), { target: { value } })
}

/** `hidden: true` skips the per-element accessibility check, which takes ~300 ms per query in happy-dom. */
export function findButton(name: string | RegExp): Promise<HTMLElement> {
  return screen.findByRole("button", { name, hidden: true })
}

export function findLink(name: string | RegExp): Promise<HTMLElement> {
  return screen.findByRole("link", { name, hidden: true })
}

export function findHeading(name: string | RegExp): Promise<HTMLElement> {
  return screen.findByRole("heading", { name, hidden: true })
}

export async function clickButton(name: string | RegExp): Promise<void> {
  fireEvent.click(await findButton(name))
}
