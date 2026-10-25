"use client"

import { useSession } from "@ihsp/auth"
import { usePreferences, useUpdatePreferences } from "@ihsp/features-core"
import { useCallback, useEffect, useState } from "react"
import {
  normalizeBottomBar,
  dropLegacyBottomBar,
  readLegacyBottomBar,
  readStoredBottomBar,
  storeBottomBar,
  migrateToDashboard,
  withDashboardFlag,
  DASHBOARD_MIGRATED,
  DEFAULT_BOTTOM_BAR,
  type DestinationId,
} from "../utils/bottom-bar"

/**
 * The pages in the phone bottom bar and the way to change them. The account's choice wins, then this device's
 * storage, then the defaults. A change is kept on the device at once and saved in the account.
 */
export function useBottomBar(): {
  ids: DestinationId[]
  save: (ids: readonly DestinationId[]) => void
} {
  const { session } = useSession()
  const preferences = usePreferences()
  const update = useUpdatePreferences()
  const userId = session?.user.id ?? ""
  const [local, setLocal] = useState<DestinationId[] | null>(() => (userId ? readStoredBottomBar(userId) : null))

  // Lists saved before the Dashboard (the legacy entry always is) get the Dashboard in place of Today.
  const flagged = preferences?.onboarding_dismissed?.includes(DASHBOARD_MIGRATED) ?? false
  const legacyRaw = readLegacyBottomBar(preferences?.onboarding_dismissed)
  const legacy = legacyRaw ? migrateToDashboard(legacyRaw) : null
  const stored = preferences?.bottom_nav ? normalizeBottomBar(preferences.bottom_nav) : null
  const saved = stored && !flagged ? migrateToDashboard(stored) : stored

  // Migrate once: the old `bottom-nav:` entry moves to `bottom_nav`, a pre-Dashboard list is rewritten, the flag is set.
  const migrate = update.mutate
  useEffect(() => {
    if (!preferences || (flagged && !legacyRaw) || (!stored && !legacyRaw)) return
    migrate({
      bottom_nav: saved ?? legacy ?? undefined,
      onboarding_dismissed: withDashboardFlag(dropLegacyBottomBar(preferences.onboarding_dismissed)),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences?.onboarding_dismissed, preferences?.bottom_nav])

  const ids = saved ?? legacy ?? local ?? (userId ? readStoredBottomBar(userId) : null) ?? [...DEFAULT_BOTTOM_BAR]

  const save = useCallback(
    (next: readonly DestinationId[]) => {
      const clean = normalizeBottomBar(next)
      setLocal(clean)
      if (userId) storeBottomBar(userId, clean)
      if (!preferences) return
      // Saving marks the account as Dashboard-era, so a chosen Today is not migrated later.
      update.mutate(
        flagged
          ? { bottom_nav: clean }
          : { bottom_nav: clean, onboarding_dismissed: withDashboardFlag(preferences.onboarding_dismissed ?? []) },
      )
    },
    [flagged, preferences, update, userId],
  )

  return { ids, save }
}
