"use client"

import { useEffect, useState } from "react"
import { usePreferences, useUpdatePreferences } from "../notification-settings-form"

/** The id the tour leaves in `preferences.onboarding_dismissed` (the same list as the Today get-started steps). */
export const TOUR_DISMISSED_ID = "tour"

const REPLAY_EVENT = "ihsp:onboarding-tour"

/** Opens the tour again (the "Take the tour" button of Settings); the mounted `OnboardingTour` listens. */
export function replayOnboardingTour(): void {
  window.dispatchEvent(new Event(REPLAY_EVENT))
}

/**
 * State of the first-run tour: open on the first visit (the id is not in `onboarding_dismissed`) or on replay.
 * Closing it by any way (skip, finish, a link inside it) remembers the id, so it never shows by itself again.
 */
export function useOnboardingTour(): { open: boolean; close: () => void } {
  const preferences = usePreferences()
  const update = useUpdatePreferences()
  const [replay, setReplay] = useState(false)

  useEffect(() => {
    const onReplay = () => setReplay(true)
    window.addEventListener(REPLAY_EVENT, onReplay)
    return () => window.removeEventListener(REPLAY_EVENT, onReplay)
  }, [])

  const dismissed = preferences?.onboarding_dismissed ?? []
  const firstRun = preferences !== null && !dismissed.includes(TOUR_DISMISSED_ID)

  const close = () => {
    setReplay(false)
    if (firstRun) update.mutate({ onboarding_dismissed: [...new Set([...dismissed, TOUR_DISMISSED_ID])] })
  }
  return { open: firstRun || replay, close }
}
