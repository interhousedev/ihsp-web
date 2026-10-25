"use client"

import { useT } from "@ihsp/i18n"
import { isMiniApp } from "@ihsp/telegram/core"
import type { UserMenuItem } from "@ihsp/ui"
import { IconDeviceMobile } from "@ihsp/ui"
import { installAppUrl, isPwaMode } from "../utils/app-mode"

/**
 * The "Install the app" entry of the portal's profile menu: it opens the installable app (`APP_URL`) in a new tab.
 * `null` where it makes no sense: in the app itself, inside Telegram, or when no app host is configured.
 */
export function useInstallMenuItem(): UserMenuItem | null {
  const t = useT("pwa")
  const url = installAppUrl()
  if (!url || isPwaMode() || isMiniApp()) return null
  return {
    key: "install-app",
    title: t("menu.install"),
    icon: IconDeviceMobile,
    onSelect: () => {
      window.open(url, "_blank", "noopener,noreferrer")
    },
  }
}
