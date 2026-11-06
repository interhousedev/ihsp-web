import { isMiniApp } from "@ihsp/telegram/core"

/**
 * Sends the user to a file's address. The Telegram webview cannot save files or open popups, so inside the mini app the
 * address leaves through the SDK to the system browser, where any size downloads; elsewhere it is a new tab.
 */
export async function openFileUrl(
  url: string,
  loadTelegram: () => Promise<{ openExternalLink: (url: string) => boolean }> = () => import("@ihsp/telegram"),
): Promise<void> {
  if (isMiniApp()) {
    const { openExternalLink } = await loadTelegram()
    if (openExternalLink(url)) return
  }
  window.open(url, "_blank", "noopener,noreferrer")
}
