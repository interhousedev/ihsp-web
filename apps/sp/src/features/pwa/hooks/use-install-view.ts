"use client"

import { isMiniApp } from "@ihsp/telegram"
import { useCallback, useState } from "react"
import { readContinueInBrowser, rememberContinueInBrowser } from "../utils/continue-in-browser"
import { pickInstallView, type InstallView } from "../utils/install-view"
import { detectPlatform, isInAppBrowser, isStandaloneDisplay, type Platform } from "../utils/platform"
import { useInstallPrompt, type InstallOutcome } from "./use-install-prompt"

/** What the page knows about the browser it runs in; read once per visit. */
export type PageEnvironment = {
  platform: Platform
  standalone: boolean
  miniApp: boolean
  inAppBrowser: boolean
}

export function readPageEnvironment(): PageEnvironment {
  const { userAgent, platform, maxTouchPoints } = window.navigator
  return {
    platform: detectPlatform({ userAgent, platform, maxTouchPoints }),
    standalone: isStandaloneDisplay({
      matchMedia: (query) => window.matchMedia(query),
      navigator: window.navigator as Navigator & { standalone?: boolean },
      referrer: document.referrer,
    }),
    miniApp: isMiniApp(),
    inAppBrowser: isInAppBrowser(userAgent),
  }
}

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
