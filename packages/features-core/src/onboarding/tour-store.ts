"use client"

import { useSyncExternalStore } from "react"

type TourState = {
  /** The tour was asked for again (Settings → Take the tour); a first run does not need it. */
  replay: boolean
  /** The tour is set aside while the user explores; the "Back to tour" pill stands in for it. */
  paused: boolean
  index: number
}

const INITIAL: TourState = { replay: false, paused: false, index: 0 }

let state: TourState = INITIAL
const listeners = new Set<() => void>()

/**
 * Lives outside React: each page of an app renders its own shell, so the tour component is remounted on every
 * navigation, and the step and the pause must survive that.
 */
export function setTourState(next: Partial<TourState>): void {
  state = { ...state, ...next }
  for (const listener of listeners) listener()
}

export function resetTourState(): void {
  setTourState(INITIAL)
}

export function useTourState(): TourState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => state,
    () => state,
  )
}
