"use client"

import { readPageEnvironment, type PageEnvironment } from "@ihsp/features-core/pwa"
import { useCallback, useState } from "react"
import { readContinueInBrowser, rememberContinueInBrowser } from "../utils/continue-in-browser"
import { pickInstallView, type InstallView } from "../utils/install-view"
import { useInstallPrompt, type InstallOutcome } from "./use-install-prompt"

export type InstallViewState = {
  view: InstallView
  environment: PageEnvironment
  install: () => Promise<InstallOutcome>
  continueInBrowser: () => void
}

/** Which screen to show now (the app or an install page), and the two things the install page can do. */
export function useInstallView(): InstallViewState {
  const [environment] = useState(readPageEnvironment)
  const [continued, setContinued] = useState(readContinueInBrowser)
  const prompt = useInstallPrompt()

  const continueInBrowser = useCallback(() => {
    rememberContinueInBrowser()
    setContinued(true)
  }, [])

  const view = pickInstallView({
    pwaMode: true,
    standalone: environment.standalone,
    miniApp: environment.miniApp,
    continueInBrowser: continued,
    platform: environment.platform,
    hasPrompt: prompt.canPrompt,
    installed: prompt.installed,
    inAppBrowser: environment.inAppBrowser,
  })
  return { view, environment, install: prompt.install, continueInBrowser }
}
