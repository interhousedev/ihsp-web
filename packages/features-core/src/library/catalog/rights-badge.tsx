"use client"

import type { Rights } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

/** The rights class of a book as a short badge; for an open licence it names the licence ("CC BY-SA 4.0"). */
export function RightsBadge({ rights, licence }: { rights: Rights; licence?: string | null }) {
  const t = useT("library.rights")
  const label = rights === "open_license" ? t("open_license", { licence: licence ?? t("licenceFallback") }) : t(rights)
  return (
    <Badge variant="secondary" className="max-w-full truncate font-normal">
      {label}
    </Badge>
  )
}
