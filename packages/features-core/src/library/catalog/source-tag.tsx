"use client"

import type { ItemCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, cn } from "@ihsp/ui"
import { IconBook, IconBuildingBank, IconFileText } from "@tabler/icons-react"

const TONE: Record<ItemCard["tag"]["source"], string> = {
  // UniLibrary has its own colour so it is never mistaken for the lyceum's own content.
  unilibrary:
    "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-200",
  book: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200",
  material: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-200",
}

const ICON = { unilibrary: IconBuildingBank, book: IconBook, material: IconFileText } as const

/** The source tag of a card: **UniLibrary** (government service, own colour), **Library book** or **Material**. */
export function SourceTag({ source, className }: { source: ItemCard["tag"]["source"]; className?: string }) {
  const t = useT("library.tag")
  const Icon = ICON[source]
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-medium", TONE[source], className)}
      title={source === "unilibrary" ? t("unilibraryHint") : undefined}
    >
      <Icon className="size-3" aria-hidden />
      {t(source)}
    </Badge>
  )
}
