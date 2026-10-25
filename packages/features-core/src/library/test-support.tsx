// Test helpers for the library components (not exported from the package).
import { configure } from "@testing-library/react"
import { mergeMessages, type Locale, type Messages } from "@ihsp/i18n"
import {
  apiUrl,
  problem,
  renderWithProviders,
  server,
  setLibraryActor,
  type RenderWithProvidersOptions,
} from "@ihsp/test-utils"
import { http } from "msw"
import type { ReactElement } from "react"
import enLibrary from "./messages/en/index"
import ruLibrary from "./messages/ru/index"
import uzLibrary from "./messages/uz/index"

const LIBRARY: Record<Locale, Messages> = { en: enLibrary, ru: ruLibrary, uz: uzLibrary }

/** The `library.*` messages of a locale (what `loadLibraryMessages` loads in the app). */
export function libraryMessages(locale: Locale = "en"): Messages {
  return LIBRARY[locale]
}

/** Library screens fetch several queries and render big trees: allow a little more time than the default. */
export function allowSlowRenders(): void {
  configure({ asyncUtilTimeout: 5000 })
}

/**
 * `renderWithProviders` with the `library` messages merged in (the shared messages come from the helper). The default
 * mock state has UniLibrary switched **off**; a test that needs it calls `setUniLibrary({ enabled: true })` of
 * `@ihsp/test-utils` first. Pass `session: null` for a signed-out visitor.
 */
export function renderLibrary(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const messages = mergeMessages(libraryMessages(options.locale ?? "en"), options.messages ?? {})
  return renderWithProviders(ui, { ...options, messages })
}

/**
 * A signed-out visitor: no session, the mocked API treats the caller as anonymous, and the session refresh fails like
 * it does without a cookie (the shared mock would otherwise log the visitor in on the first `401`).
 */
export function renderLibraryAnonymous(ui: ReactElement, options: Omit<RenderWithProvidersOptions, "session"> = {}) {
  setLibraryActor(null)
  server.use(http.post(apiUrl("/v1/oauth/refresh"), () => problem(401, "auth/unauthorized", "No session")))
  return renderLibrary(ui, { ...options, session: null })
}
