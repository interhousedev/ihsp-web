"use client"

import { getMeEmisRatingBook } from "@ihsp/api"
import { openFileUrl } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { isMiniApp } from "@ihsp/telegram/core"
import { Button, IconFileTypePdf, Spinner } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"

/**
 * Opens the EMIS rating book PDF. On the web the tab is opened in the click itself, before the request, because a tab
 * opened after an `await` is blocked as a popup; it is pointed at the link when that arrives and closed on failure.
 * The Telegram webview has no tabs, so there the address leaves through the SDK once the request is done.
 */
export function RatingBookButton() {
  const t = useT("grades.ratingBook")
  const [pending, setPending] = useState(false)

  async function open() {
    const tab = isMiniApp() ? null : window.open("", "_blank")
    if (tab) tab.opener = null
    setPending(true)
    try {
      const { url } = await getMeEmisRatingBook()
      if (tab) tab.location.href = url
      else await openFileUrl(url)
    } catch {
      tab?.close()
      toast.error(t("error"))
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="min-h-11 md:min-h-8"
      disabled={pending}
      aria-busy={pending}
      onClick={() => void open()}
    >
      {pending ? <Spinner /> : <IconFileTypePdf aria-hidden />}
      {t("button")}
    </Button>
  )
}
