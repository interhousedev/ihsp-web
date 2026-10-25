/** Where the install page runs: it decides which instructions are shown. */
export type Platform = "ios" | "android" | "desktop"

export type NavigatorSnapshot = {
  userAgent: string
  platform?: string
  maxTouchPoints?: number
}

/** iPhone, iPad (including iPadOS, which calls itself a Mac with a touch screen), Android, or everything else. */
export function detectPlatform({ userAgent, platform = "", maxTouchPoints = 0 }: NavigatorSnapshot): Platform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios"
  if (platform === "MacIntel" && maxTouchPoints > 1) return "ios"
  if (/Android/i.test(userAgent)) return "android"
  return "desktop"
}

/**
 * Browsers inside other apps (Telegram, Instagram, Facebook, ...) cannot add a page to the home screen: the user has to
 * open the link in the real browser first.
 */
export function isInAppBrowser(userAgent: string): boolean {
  return /FBAN|FBAV|Instagram|Line\/|Telegram|MicroMessenger|Snapchat|; wv\)/i.test(userAgent)
}

export type DisplayEnv = {
  matchMedia: (query: string) => { matches: boolean }
  navigator: { standalone?: boolean }
  referrer?: string
}

/** True when the page runs as an installed app (home screen icon, Trusted Web Activity), not in a browser tab. */
export function isStandaloneDisplay({ matchMedia, navigator, referrer = "" }: DisplayEnv): boolean {
  if (navigator.standalone === true) return true
  if (referrer.startsWith("android-app://")) return true
  return ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"].some(
    (mode) => matchMedia(`(display-mode: ${mode})`).matches,
  )
}
