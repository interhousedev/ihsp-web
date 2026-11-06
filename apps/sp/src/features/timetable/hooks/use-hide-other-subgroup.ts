"use client"

import { usePreferences, useUpdatePreferences } from "@ihsp/features-core"

/** Kept with the account's other UI flags, so the choice follows the user across devices. */
export const HIDE_OTHER_SUBGROUP = "timetable:hide-other-subgroup"

/** Whether the calendar hides the lessons of the other subgroup, and the way to change it. */
export function useHideOtherSubgroup(): { hidden: boolean; setHidden: (hidden: boolean) => void } {
  const preferences = usePreferences()
  const update = useUpdatePreferences()
  const flags = preferences?.onboarding_dismissed ?? []
  return {
    hidden: flags.includes(HIDE_OTHER_SUBGROUP),
    setHidden: (hidden) => {
      const others = flags.filter((flag) => flag !== HIDE_OTHER_SUBGROUP)
      update.mutate({ onboarding_dismissed: hidden ? [...others, HIDE_OTHER_SUBGROUP] : others })
    },
  }
}
