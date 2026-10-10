"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Spinner } from "@ihsp/ui"
import { IconDownload } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { TOUCH } from "../utils/touch"

/** "Export CSV" (ADM-16): runs `onExport` (fetch and download) and shows progress and errors. */
export function ExportButton({ onExport, label }: { onExport: () => Promise<void>; label?: string }) {
  const t = useT("shared")
  const errorMessage = useErrorMessage()
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    try {
      await onExport()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button type="button" variant="outline" className={TOUCH} disabled={busy} onClick={() => void run()}>
      {busy ? <Spinner aria-hidden /> : <IconDownload aria-hidden />}
      {label ?? t("exportCsv")}
    </Button>
  )
}
