"use client"

import { BootSplash } from "@ihsp/config"

/**
 * The loading screen of the login: the same spinner the static HTML, `ConfigGate` and `I18nProvider` show, so the whole
 * start of an app is one spinner. `text` is read by screen readers only; it does not change between steps.
 */
export function FullScreenSpinner({ text }: { text?: string }) {
  return <BootSplash label={text} />
}
