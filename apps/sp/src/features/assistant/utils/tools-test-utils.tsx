import { setDefaultTimeout } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { renderWithProviders, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import { configure } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import type { ReactElement } from "react"
import enTools from "../../../../messages/en/tools.json"

const EN_DIR = join(import.meta.dir, "../../../../messages/en")

/**
 * `notebooks.json` plus every `notebooks.<area>.json` next to it (parts that parallel tasks add; the coordinator merges
 * them into `notebooks.json` at the end). The assistant workspace uses the `assistant.*` additions and `notebooks.*`.
 */
function notebooksMessages(): Messages {
  const files = readdirSync(EN_DIR)
    .filter((name) => /^notebooks(\..+)?\.json$/.test(name))
    .toSorted((a, b) => (a === "notebooks.json" ? -1 : b === "notebooks.json" ? 1 : a.localeCompare(b)))
  return files.reduce<Messages>(
    (merged, name) => mergeMessages(merged, JSON.parse(readFileSync(join(EN_DIR, name), "utf8")) as Messages),
    {},
  )
}

const messages = mergeMessages(enTools as Messages, notebooksMessages())

/**
 * Large pages render slowly in a cold test run, so wait longer than the defaults. Call it at the top of every
 * test file: Bun applies the default timeout per file.
 */
export function allowSlowRenders(): void {
  configure({ asyncUtilTimeout: 8000 })
  setDefaultTimeout(30_000)
}

/** `renderWithProviders` with the English messages of the study tools (assistant, flash cards, files, links, notebooks). */
export function renderTools(ui: ReactElement, options: Omit<RenderWithProvidersOptions, "messages"> = {}) {
  return renderWithProviders(ui, { ...options, messages })
}

/** Pasting is one event; typing every character re-renders a big page dozens of times. */
export async function enter(user: UserEvent, field: HTMLElement, text: string): Promise<void> {
  await user.click(field)
  await user.paste(text)
}

export async function readBody(request: Request): Promise<unknown> {
  return request.json()
}
