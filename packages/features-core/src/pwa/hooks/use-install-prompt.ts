"use client"

import { useCallback, useEffect, useState } from "react"
import { INSTALL_PROMPT_EVENT, INSTALL_PROMPT_GLOBAL } from "../utils/pwa-head"

/** Chrome's `beforeinstallprompt` event (not in the DOM typings). */
export type InstallPromptEvent = Event & {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable"

export function isInstallPromptEvent(value: unknown): value is InstallPromptEvent {
  return typeof value === "object" && value !== null && typeof (value as { prompt?: unknown }).prompt === "function"
}

type WithPrompt = { [INSTALL_PROMPT_GLOBAL]?: unknown }

/** The event the inline head script caught before React was ready. */
function readCaught(): InstallPromptEvent | null {
  if (typeof window === "undefined") return null
  const caught = (window as unknown as WithPrompt)[INSTALL_PROMPT_GLOBAL]
  return isInstallPromptEvent(caught) ? caught : null
}

function forget(): void {
  delete (window as unknown as WithPrompt)[INSTALL_PROMPT_GLOBAL]
}

/**
 * Chrome and Edge (Android and desktop) let the page open their install dialog from its own button. `canPrompt` is true
 * once the browser has offered it; `install()` opens the dialog. `installed` becomes true when the app was installed
 * during this visit (`appinstalled`). Safari on iOS has no such event: it gets written instructions instead.
 */
export function useInstallPrompt(): { canPrompt: boolean; installed: boolean; install: () => Promise<InstallOutcome> } {
  const [event, setEvent] = useState<InstallPromptEvent | null>(readCaught)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onCaught = () => setEvent(readCaught())
    const onPrompt = (raw: Event) => {
      raw.preventDefault()
      if (isInstallPromptEvent(raw)) setEvent(raw)
    }
    const onInstalled = () => {
      forget()
      setEvent(null)
      setInstalled(true)
    }
    window.addEventListener(INSTALL_PROMPT_EVENT, onCaught)
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener(INSTALL_PROMPT_EVENT, onCaught)
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const install = useCallback(async (): Promise<InstallOutcome> => {
    if (!event) return "unavailable"
    await event.prompt()
    const { outcome } = await event.userChoice
    // A prompt event can be used once; after a dismissal Chrome fires a new one later.
    forget()
    setEvent(null)
    return outcome
  }, [event])

  return { canPrompt: event !== null, installed, install }
}
