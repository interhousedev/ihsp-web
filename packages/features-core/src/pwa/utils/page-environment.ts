import { isMiniApp } from "@ihsp/telegram"
import { detectPlatform, isInAppBrowser, isStandaloneDisplay, type Platform } from "./platform"

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
