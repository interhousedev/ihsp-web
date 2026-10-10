"use client"

import { useSession } from "@ihsp/auth"
import { usePreferences, useUpdatePreferences } from "@ihsp/features-core"
import { useCallback, useState } from "react"
import {
  normalizeBottomBar,
  readBottomBar,
  readStoredBottomBar,
  storeBottomBar,
  writeBottomBar,
  DEFAULT_BOTTOM_BAR,
  type DestinationId,
} from "../utils/bottom-bar"

/**
 * The pages in the phone bottom bar and the way to change them. The account's choice wins, then this device's
 * storage, then the defaults. A change is kept on the device at once and saved in the account.
 */
export function useBottomBar(): { ids: DestinationId[]; save: (ids: readonly DestinationId[]) => void } {
  const { session } = useSession()
  const preferences = usePreferences()
  const update = useUpdatePreferences()
  const userId = session?.user.id ?? ""
  const [local, setLocal] = useState<DestinationId[] | null>(() => (userId ? readStoredBottomBar(userId) : null))

  const ids =
    readBottomBar(preferences?.onboarding_dismissed) ?? local ?? (userId ? readStoredBottomBar(userId) : null) ?? [
      ...DEFAULT_BOTTOM_BAR,
    ]

  const save = useCallback(
    (next: readonly DestinationId[]) => {
      const clean = normalizeBottomBar(next)
      setLocal(clean)
      if (userId) storeBottomBar(userId, clean)
      if (preferences) update.mutate({ onboarding_dismissed: writeBottomBar(preferences.onboarding_dismissed, clean) })
    },
    [preferences, update, userId],
  )

  return { ids, save }
}
