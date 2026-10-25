"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { OfflineBadge, useOnline } from "@ihsp/ui"
import { useCachedDataAge } from "../hooks/use-cached-data-age"
import { useNetworkFailure } from "../hooks/use-network-failure"

/**
 * The header "Offline" badge: the browser is offline, or the last fetch failed with a network error. Next to it, how
 * old the cached data is ("Updated 2 h ago"), so the student knows the pages are not current.
 */
export function OfflineIndicator() {
  const t = useT("offline")
  const f = useFormatters()
  const failed = useNetworkFailure()
  const online = useOnline()
  const cachedAt = useCachedDataAge()
  const offline = failed || !online
  return (
    <span className="flex items-center gap-2">
      <OfflineBadge forceVisible={failed} />
      {offline && cachedAt !== null ? (
        <span className="text-muted-foreground text-xs">{t("updated", { when: f.relative(cachedAt) })}</span>
      ) : null}
    </span>
  )
}
