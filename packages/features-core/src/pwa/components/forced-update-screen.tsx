"use client"

import { useT } from "@ihsp/i18n"
import { Spinner } from "@ihsp/ui"

/** Covers the app while a forced update reloads it (this build is older than the backend allows). */
export function ForcedUpdateScreen() {
  const t = useT("pwa")
  return (
    <main
      role="alert"
      className="bg-background fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <Spinner className="size-8" />
      <h1 className="text-lg font-semibold">{t("update.forced.title")}</h1>
      <p className="text-muted-foreground text-sm">{t("update.forced.text")}</p>
    </main>
  )
}
