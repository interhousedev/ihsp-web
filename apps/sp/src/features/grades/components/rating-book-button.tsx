"use client"

import { getMeEmisRatingBook } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, IconFileTypePdf } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"

/**
 * Opens the EMIS rating book PDF in a new tab. The tab is opened in the click itself, before the request, because a
 * tab opened after an `await` is blocked as a popup; it is pointed at the link when that arrives and closed on failure.
 */
export function RatingBookButton() {
  const t = useT("grades.ratingBook")
  const [pending, setPending] = useState(false)

  async function open() {
    const tab = window.open("", "_blank")
    if (tab) tab.opener = null
    setPending(true)
    try {
      const { url } = await getMeEmisRatingBook()
      if (tab) tab.location.href = url
      else window.open(url, "_blank", "noopener,noreferrer")
    } catch {
      tab?.close()
      toast.error(t("error"))
    } finally {
      setPending(false)
    }
  }

  return (
    <Button variant="outline" className="min-h-11 md:min-h-8" disabled={pending} onClick={() => void open()}>
      <IconFileTypePdf aria-hidden />
      {t("button")}
    </Button>
  )
}
