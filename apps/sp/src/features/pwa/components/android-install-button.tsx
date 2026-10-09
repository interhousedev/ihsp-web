"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconDownload } from "@tabler/icons-react"
import { useState } from "react"
import type { InstallOutcome } from "../hooks/use-install-prompt"

/** The real install button of Chrome and Edge: it opens the browser's own install dialog. */
export function AndroidInstallButton({ onInstall }: { onInstall: () => Promise<InstallOutcome> }) {
  const t = useT("pwa")
  const [busy, setBusy] = useState(false)

  const install = async () => {
    setBusy(true)
    try {
      await onInstall()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button className="h-12 w-full text-base" disabled={busy} onClick={() => void install()}>
      <IconDownload aria-hidden />
      {busy ? t("install.busy") : t("install.button")}
    </Button>
  )
}
