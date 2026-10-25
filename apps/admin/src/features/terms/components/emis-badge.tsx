"use client"

import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

/** Marks a bell that the EMIS class-hours sync set; the hint says where it comes from. */
export function EmisBadge() {
  const t = useT("terms.bells")
  return (
    <Badge variant="outline" title={t("emisHint")}>
      {t("emis")}
    </Badge>
  )
}
