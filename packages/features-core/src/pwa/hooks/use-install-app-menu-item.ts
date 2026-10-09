"use client"

import { useT } from "@ihsp/i18n"
import type { UserMenuItem } from "@ihsp/ui"
import { IconDeviceMobileDown } from "@tabler/icons-react"
import { useState } from "react"
import { toast } from "sonner"
import { isPwaMode } from "../utils/app-mode"
import { readPageEnvironment } from "../utils/page-environment"
import { useInstallPrompt } from "./use-install-prompt"

/**
 * The "Install the app" entry of the profile menu of an installable app other than the student one (those have no install
 * page: this is their only way to it). It opens the browser's own install dialog where the browser offers one (Chrome,
 * Edge); on iPhone, and where no dialog came, it says which buttons to tap. `null` in a plain website, inside Telegram, in
 * the installed app itself, and once the app was installed during this visit.
 */
export function useInstallAppMenuItem(): UserMenuItem | null {
  const t = useT("pwa")
  const prompt = useInstallPrompt()
  const [environment] = useState(() => (typeof window === "undefined" ? null : readPageEnvironment()))
  if (!isPwaMode() || !environment || environment.standalone || environment.miniApp || prompt.installed) return null
  return {
    key: "install-this-app",
    title: t("menu.install"),
    icon: IconDeviceMobileDown,
    onSelect: () => {
      if (prompt.canPrompt) {
        void prompt.install()
        return
      }
      toast(t(environment.platform === "ios" ? "menu.iosHint" : "menu.manualHint"), { duration: 12_000 })
    },
  }
}
