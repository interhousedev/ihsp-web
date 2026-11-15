"use client"

import { usePreferences, useUpdatePreferences } from "@ihsp/features-core"

/** Kept with the account's other UI flags, so the choice follows the user across devices. Absent means hidden. */
export const SHOW_OTHER_SUBGROUP = "timetable:show-other-subgroup"

/** Whether the calendar shows the lessons of the other subgroup (off by default), and the way to change it. */
export function useShowOtherSubgroup(): { shown: boolean; setShown: (shown: boolean) => void } {
  const preferences = usePreferences()
  const update = useUpdatePreferences()
  const flags = preferences?.onboarding_dismissed ?? []
  return {
    shown: flags.includes(SHOW_OTHER_SUBGROUP),
    setShown: (shown) => {
      const others = flags.filter((flag) => flag !== SHOW_OTHER_SUBGROUP)
      update.mutate({ onboarding_dismissed: shown ? [...others, SHOW_OTHER_SUBGROUP] : others })
    },
  }
}
