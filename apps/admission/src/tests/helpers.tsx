import { renderWithProviders, type RenderWithProvidersOptions } from "@ihsp/test-utils"
import { configure } from "@testing-library/react"
import type { ReactElement } from "react"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import en from "../../messages/en.json"

// The first render of a page in a cold test run takes several seconds.
configure({ asyncUtilTimeout: 10_000 })

/** Renders with the app's own English messages merged over the shared ones. */
export function renderAdmissionApp(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  return renderWithProviders(ui, { ...options, messages: mergeMessages(en as Messages, options.messages ?? {}) })
}
