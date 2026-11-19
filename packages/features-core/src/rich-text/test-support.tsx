// Test helpers for the rich-text editor (not exported from the package).
import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { Locale, Messages } from "@ihsp/i18n"
import { renderWithProviders, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import type { ReactElement } from "react"

const MESSAGES_DIR = join(import.meta.dir, "../../../../apps/lms/messages")

/** The `richText` messages of `apps/lms` (every app that shows the editor carries the same block). */
export function richTextMessages(locale: Locale = "en"): Messages {
  const all = JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf8")) as Messages
  return { richText: all.richText } as Messages
}

/** `renderWithProviders` with the editor's messages merged in. */
export function renderRichText(ui: ReactElement, options: Omit<RenderWithProvidersOptions, "messages"> = {}) {
  return renderWithProviders(ui, { ...options, messages: richTextMessages(options.locale ?? "en") })
}
