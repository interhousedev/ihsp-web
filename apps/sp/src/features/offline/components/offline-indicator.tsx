"use client"

import { OfflineBadge } from "@ihsp/ui"
import { useNetworkFailure } from "../hooks/use-network-failure"

/** The header "Offline" badge: the browser is offline, or the last fetch failed with a network error. */
export function OfflineIndicator() {
  return <OfflineBadge forceVisible={useNetworkFailure()} />
}
