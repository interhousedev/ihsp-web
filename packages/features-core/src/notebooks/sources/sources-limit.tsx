"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { IconAlertTriangle } from "@ihsp/ui"
import { LIMIT_WARN_RATIO, SOURCE_LIMIT } from "./constants"

/** The quiet "12 of 50 sources" footer; amber (with an icon and a hint) from 90 % of the limit. */
export function SourcesLimit({ count, limit = SOURCE_LIMIT }: { count: number; limit?: number }) {
  const t = useT("notebooks")
  const near = count >= limit * LIMIT_WARN_RATIO
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 border-t px-4 py-2 text-xs",
        near ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
      )}
    >
      {near ? <IconAlertTriangle aria-hidden className="size-3.5 shrink-0" /> : null}
      <span>{t("sources.limit", { count, limit })}</span>
      {near ? <span className="sr-only">{t("sources.limitNear")}</span> : null}
    </p>
  )
}
