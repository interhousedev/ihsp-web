"use client"

import { useT } from "@ihsp/i18n"
import { IconCircleCheck } from "@tabler/icons-react"

/** Shown after the install dialog was accepted: the app lives on the home screen now. */
export function InstalledNotice() {
  const t = useT("pwa")
  return (
    <section role="status" className="bg-card flex flex-col items-center gap-2 rounded-xl border p-5 text-center">
      <IconCircleCheck aria-hidden className="text-primary size-10" />
      <h2 className="text-base font-semibold">{t("installed.title")}</h2>
      <p className="text-muted-foreground text-sm">{t("installed.text")}</p>
    </section>
  )
}
