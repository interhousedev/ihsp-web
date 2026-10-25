import { setDefaultTimeout } from "bun:test"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { renderWithProviders, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import { configure } from "@testing-library/react"
import type { ReactElement } from "react"
import enMessages from "../../messages/en.json"
import enNotebooks from "../../../sp/messages/en/notebooks.json"

/** The share texts and the notebook texts the Studio viewers use. */
const messages = mergeMessages(enMessages as Messages, enNotebooks as Messages)

/** happy-dom renders the Base UI components slowly: call at the top of every test file. */
export function allowSlowTests(): void {
  setDefaultTimeout(60_000)
  configure({ asyncUtilTimeout: 8000 })
}

/** The viewer reads the slug from `location.pathname`, as it does behind the nginx rewrite. */
export function shareRoute(slug: string): string {
  return `/ai/${slug}/`
}

/** An anonymous visitor with the share app's English messages. */
export function renderShare(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  return renderWithProviders(ui, { messages, session: null, ...options })
}
