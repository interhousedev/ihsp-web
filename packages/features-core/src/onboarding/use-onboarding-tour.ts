"use client"

import { useEffect } from "react"
import { usePreferences, useUpdatePreferences } from "../notification-settings-form"
import { resetTourState, setTourState, useTourState } from "./tour-store"

/** The id the tour leaves in `preferences.onboarding_dismissed` (the same list as the Today get-started steps). */
export const TOUR_DISMISSED_ID = "tour"

const REPLAY_EVENT = "ihsp:onboarding-tour"

/** Opens the tour again (the "Take the tour" button of Settings); the mounted `OnboardingTour` listens. */
export function replayOnboardingTour(): void {
  window.dispatchEvent(new Event(REPLAY_EVENT))
}

export type OnboardingTourControls = {
  /** The dialog is showing. */
  open: boolean
  /** Running but set aside: the "Back to tour" pill shows instead of the dialog. */
  paused: boolean
  index: number
  setIndex: (index: number) => void
  /** Sets the tour aside without ending it (clicking out of it, following a link to a place). */
  pause: () => void
  resume: () => void
  /** Ends the tour: it is remembered and never shows by itself again. */
  close: () => void
}

/**
 * State of the first-run tour: running on the first visit (the id is not in `onboarding_dismissed`) or on replay.
 * Ending it (skip, finish, end in the pill) remembers the id. Closing the dialog only pauses it.
 */
export function useOnboardingTour(): OnboardingTourControls {
  const preferences = usePreferences()
  const update = useUpdatePreferences()
  const { replay, paused, index } = useTourState()

  useEffect(() => {
    const onReplay = () => setTourState({ replay: true, paused: false, index: 0 })
    window.addEventListener(REPLAY_EVENT, onReplay)
    return () => window.removeEventListener(REPLAY_EVENT, onReplay)
  }, [])

  const dismissed = preferences?.onboarding_dismissed ?? []
  const firstRun = preferences !== null && !dismissed.includes(TOUR_DISMISSED_ID)
  const running = firstRun || replay

  const close = () => {
    resetTourState()
    if (firstRun) update.mutate({ onboarding_dismissed: [...new Set([...dismissed, TOUR_DISMISSED_ID])] })
  }
  return {
    open: running && !paused,
    paused: running && paused,
    index,
    setIndex: (next) => setTourState({ index: next }),
    pause: () => setTourState({ paused: true }),
    resume: () => setTourState({ paused: false }),
    close,
  }
}

/** True while the first-run tour (or a replay) is showing or set aside: other promos wait until it ends. */
export function useTourPending(): boolean {
  const { open, paused } = useOnboardingTour()
  return open || paused
}
