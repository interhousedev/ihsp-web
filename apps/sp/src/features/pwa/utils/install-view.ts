import type { Platform } from "./platform"

export type InstallContext = {
  /** `APP_MODE === "pwa"`; in the portal there is no install page. */
  pwaMode: boolean
  /** Running as an installed app (home screen), see `isStandaloneDisplay`. */
  standalone: boolean
  /** Inside Telegram's mini app: it cannot be installed there and the user is already in the app. */
  miniApp: boolean
  /** The user chose "Continue in browser" recently. */
  continueInBrowser: boolean
  platform: Platform
  /** Chrome gave us `beforeinstallprompt`, so a real install button works. */
  hasPrompt: boolean
  /** The app was installed during this visit (`appinstalled`). */
  installed: boolean
  /** A browser inside another app (Telegram, Instagram): it cannot add to the home screen. */
  inAppBrowser: boolean
}

/** What a visit shows: the app itself, or one of the install pages. */
export type InstallView = "app" | "installed" | "android-prompt" | "android-manual" | "ios" | "desktop"

/**
 * The install page of the installable app (UF: opens as "please add our app to your phone" in a browser tab, and as the
 * app once installed). Only a normal browser tab in pwa mode gets a page; everything else gets the app.
 */
export function pickInstallView(context: InstallContext): InstallView {
  if (!context.pwaMode || context.standalone || context.miniApp) return "app"
  if (context.installed) return "installed"
  if (context.continueInBrowser) return "app"
  if (context.platform === "ios") return "ios"
  if (context.platform === "android") return context.hasPrompt ? "android-prompt" : "android-manual"
  return "desktop"
}
