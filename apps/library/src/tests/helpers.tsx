import { libraryMessages } from "@ihsp/features-core/library-test-support"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { renderWithProviders, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import { configure } from "@testing-library/react"
import type { ReactElement } from "react"
import en from "../../messages/en.json"

// The first render of a page in a cold test run takes several seconds.
configure({ asyncUtilTimeout: 10_000 })

/** Renders with the app's own English messages and the `library` namespace merged over the shared ones. */
export function renderLibraryApp(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const messages = mergeMessages(mergeMessages(en as Messages, libraryMessages("en")), options.messages ?? {})
  return renderWithProviders(ui, { ...options, messages })
}
