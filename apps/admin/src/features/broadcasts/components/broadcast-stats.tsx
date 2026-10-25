"use client"

import type { BroadcastItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Stat } from "@ihsp/ui"

/** Delivery counts of a broadcast that is being sent or was sent (ADM-11). */
export function BroadcastStats({ stats }: { stats: NonNullable<BroadcastItem["stats"]> }) {
  const t = useT("broadcasts.stats")
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="broadcast-stats">
      <Stat label={t("total")} value={stats.total} />
      <Stat label={t("sent")} value={stats.sent} />
      <Stat label={t("failed")} value={stats.failed} />
      <Stat label={t("blocked")} value={stats.blocked} />
    </div>
  )
}
