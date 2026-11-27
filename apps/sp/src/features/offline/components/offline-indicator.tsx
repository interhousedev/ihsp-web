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
  const showFailure = failed
  const offline = showFailure || !online
  const updated = offline && cachedAt !== null ? t("updated", { when: f.relative(cachedAt) }) : null
  return (
    <span className="flex min-w-0 items-center gap-2">
      <OfflineBadge forceVisible={showFailure} />
      {updated ? (
        <span
          title={updated}
          aria-label={updated}
          className="text-muted-foreground hidden max-w-40 truncate text-xs sm:inline"
        >
          {updated}
        </span>
      ) : null}
    </span>
  )
}
