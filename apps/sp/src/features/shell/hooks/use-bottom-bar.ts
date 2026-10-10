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

  const legacy = readLegacyBottomBar(preferences?.onboarding_dismissed)
  const saved = preferences?.bottom_nav ? normalizeBottomBar(preferences.bottom_nav) : null

  // Migrate once: the old `bottom-nav:` entry moves to `bottom_nav` and leaves `onboarding_dismissed`.
  const migrate = update.mutate
  useEffect(() => {
    if (!preferences || !legacy) return
    migrate({
      ...(preferences.bottom_nav ? {} : { bottom_nav: legacy }),
      onboarding_dismissed: dropLegacyBottomBar(preferences.onboarding_dismissed),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences?.onboarding_dismissed, preferences?.bottom_nav])

  const ids = saved ?? legacy ?? local ?? (userId ? readStoredBottomBar(userId) : null) ?? [...DEFAULT_BOTTOM_BAR]

  const save = useCallback(
    (next: readonly DestinationId[]) => {
      const clean = normalizeBottomBar(next)
      setLocal(clean)
      if (userId) storeBottomBar(userId, clean)
      if (preferences) update.mutate({ bottom_nav: clean })
    },
    [preferences, update, userId],
  )

  return { ids, save }
}
