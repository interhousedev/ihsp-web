"use client"

import { useT } from "@ihsp/i18n"
import type { UserMenuItem } from "@ihsp/ui"
import { IconDeviceMobileDown } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { pwaAppId } from "../utils/app-id"
import { installAppUrl, isPwaMode } from "../utils/app-mode"
import { hubInstallUrl } from "../utils/hub-install"
import { readPageEnvironment } from "../utils/page-environment"
import { useInstallPrompt } from "./use-install-prompt"

/**
 * The "Install the app" entry of the profile menu of an installable app other than the student one. With an apps hub
 * (`APP_URL`) it opens the hub's install page of this app (`/install/?app=library`), which explains the steps and comes
 * back with `?install=1`. Without a hub it opens the browser's own install dialog where the browser offers one (Chrome,
 * Edge); on iPhone, and where no dialog came, it says which buttons to tap. `null` in a plain website, inside Telegram, in
 * the installed app itself, and once the app was installed during this visit.
 */
export function useInstallAppMenuItem(): UserMenuItem | null {
  const t = useT("pwa")
  const prompt = useInstallPrompt()
  const [environment] = useState(() => (typeof window === "undefined" ? null : readPageEnvironment()))
  if (!isPwaMode() || !environment || environment.standalone || environment.miniApp || prompt.installed) return null
  const hub = installAppUrl()
  const app = pwaAppId()
  return {
    key: "install-this-app",
    title: t("menu.install"),
    icon: IconDeviceMobileDown,
    onSelect: () => {
      if (hub && app) {
        window.open(hubInstallUrl(hub, app), "_blank", "noopener,noreferrer")
        return
      }
      if (prompt.canPrompt) {
        void prompt.install()
        return
      }
      toast(t(environment.platform === "ios" ? "menu.iosHint" : "menu.manualHint"), { duration: 12_000 })
    },
  }
}
