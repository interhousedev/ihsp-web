"use client"

import type { SourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconRefresh } from "@tabler/icons-react"
import { SourceStatusLine } from "./source-status-line"

type SourceBannerProps = {
  source: Pick<SourceItem, "status" | "failure">
  onSync: () => void
}

/** The banner of the viewer for a source that is not `ready`: reading, failed (with the reason), gone, outdated. */
export function SourceBanner({ source, onSync }: SourceBannerProps) {
  const t = useT("notebooks")
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <SourceStatusLine source={source} className="text-sm" />
      {source.status === "stale" ? (
        <Button type="button" variant="outline" size="sm" className="min-h-11 gap-1 md:min-h-8" onClick={onSync}>
          <IconRefresh aria-hidden />
          {t("row.sync")}
        </Button>
      ) : null}
    </div>
  )
}
