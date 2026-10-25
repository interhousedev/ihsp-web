"use client"

import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

/** UniLibrary's access class of a record: marked open / partly open / access by request. */
export function AccessChip({ access }: { access: "open" | "partial" | "closed" }) {
  const t = useT("library.unilibrary.access")
  return (
    <Badge variant="secondary" className="font-normal">
      {t(access)}
    </Badge>
  )
}
