"use client"

import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { IconSparkles, IconWand } from "@ihsp/ui"

/** "Studio results will be saved here.": a wand with sparkles and a line about what to do next. */
export function StudioEmpty() {
  const t = useT("notebooks.studio")
  return (
    <StateView
      state="empty"
      className="p-4"
      icon={
        <span className="relative">
          <IconWand className="size-6" aria-hidden />
          <IconSparkles className="text-primary absolute -end-1 -top-1 size-4" aria-hidden />
        </span>
      }
      title={t("empty.title")}
      description={t("empty.description")}
    />
  )
}
