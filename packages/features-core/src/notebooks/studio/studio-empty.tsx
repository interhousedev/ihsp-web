"use client"

import { useT } from "@ihsp/i18n"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@ihsp/ui"
import { IconSparkles, IconWand } from "@tabler/icons-react"

/** "Studio results will be saved here.": a wand with sparkles and a line about what to do next. */
export function StudioEmpty() {
  const t = useT("notebooks.studio")
  return (
    <Empty className="border p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="relative size-12 rounded-xl">
          <IconWand className="size-6" aria-hidden />
          <IconSparkles className="text-primary absolute -end-1 -top-1 size-4" aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("empty.title")}</EmptyTitle>
        <EmptyDescription>{t("empty.description")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
