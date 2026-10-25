"use client"

import { useT } from "@ihsp/i18n"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useInstallPrompt } from "../hooks/use-install-prompt"
import { clearInstallRequest, hasInstallRequest } from "../utils/hub-install"
import { readPageEnvironment } from "../utils/page-environment"

/** How long to wait for Chrome's install offer before showing the written steps instead. */
export const INSTALL_PROMPT_WAIT_MS = 2_500

/**
 * The app was opened from the apps hub with `?install=1`: it offers to install itself at once. Chrome's dialog needs a tap,
 * so a toast with an "Install" button opens it; Safari on iPhone and browsers without the dialog get the steps. Nothing in
 * the installed app or inside Telegram.
 */
export function InstallRequest({ promptWaitMs = INSTALL_PROMPT_WAIT_MS }: { promptWaitMs?: number } = {}) {
  const t = useT("pwa")
  const prompt = useInstallPrompt()
  const [requested] = useState(() => {
    if (!hasInstallRequest()) return false
    const environment = readPageEnvironment()
    return environment.standalone || environment.miniApp ? false : environment.platform
  })
  const [shown, setShown] = useState(false)
  const { canPrompt, install } = prompt

  useEffect(clearInstallRequest, [])

  useEffect(() => {
    if (!requested || shown) return
    if (canPrompt) {
      setShown(true)
      toast(t("request.title"), {
        duration: 20_000,
        action: { label: t("request.install"), onClick: () => void install() },
      })
      return
    }
    const timer = window.setTimeout(() => {
      setShown(true)
      toast(t(requested === "ios" ? "menu.iosHint" : "menu.manualHint"), { duration: 20_000 })
    }, promptWaitMs)
    return () => window.clearTimeout(timer)
  }, [requested, shown, canPrompt, install, t, promptWaitMs])

  return null
}
