"use client"

import type { ItemCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, type StatusTone, cn } from "@ihsp/ui"
import { IconBook, IconBuildingBank, IconFileText } from "@ihsp/ui"

const TONE: Record<ItemCard["tag"]["source"], StatusTone> = {
  // UniLibrary has the warning tone so it is never mistaken for the lyceum's own content.
  unilibrary: "warning",
  book: "success",
  material: "info",
}

const ICON = { unilibrary: IconBuildingBank, book: IconBook, material: IconFileText } as const

/** The source tag of a card: **UniLibrary** (government service, own colour), **Library book** or **Material**. */
export function SourceTag({ source, className }: { source: ItemCard["tag"]["source"]; className?: string }) {
  const t = useT("library.tag")
  const Icon = ICON[source]
  return (
    <Badge
      variant={TONE[source]}
      className={cn("gap-1 font-medium", className)}
      title={source === "unilibrary" ? t("unilibraryHint") : undefined}
    >
      <Icon className="size-3" aria-hidden />
      {t(source)}
    </Badge>
  )
}
