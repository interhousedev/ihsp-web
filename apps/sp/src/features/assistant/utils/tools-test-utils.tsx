import { setDefaultTimeout } from "bun:test"
import type { Messages } from "@ihsp/i18n"
import { renderWithProviders, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import { configure } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import type { ReactElement } from "react"
import enTools from "../../../../messages/en/tools.json"

/**
 * Large pages render slowly in a cold test run, so wait longer than the defaults. Call it at the top of every
 * test file: Bun applies the default timeout per file.
 */
export function allowSlowRenders(): void {
  configure({ asyncUtilTimeout: 8000 })
  setDefaultTimeout(30_000)
}

/** `renderWithProviders` with the English messages of the study tools (assistant, flash cards, files, links). */
export function renderTools(ui: ReactElement, options: Omit<RenderWithProvidersOptions, "messages"> = {}) {
  return renderWithProviders(ui, { ...options, messages: enTools as Messages })
}

/** Pasting is one event; typing every character re-renders a big page dozens of times. */
export async function enter(user: UserEvent, field: HTMLElement, text: string): Promise<void> {
  await user.click(field)
  await user.paste(text)
}

export async function readBody(request: Request): Promise<unknown> {
  return request.json()
}
