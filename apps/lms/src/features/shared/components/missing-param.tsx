"use client"

import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"

/** A page that needs `?id=` (or similar) opened without it. */
export function MissingParam() {
  const t = useT("common")
  return (
    <div className="px-4 pt-4 md:px-6">
      <StateView state="empty" emptyText={t("missingParam")} />
    </div>
  )
}
