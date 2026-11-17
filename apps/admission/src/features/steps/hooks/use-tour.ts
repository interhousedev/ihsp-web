import { useCallback, useEffect, useState } from "react"
import { INITIAL_TOUR, loadTour, saveTour, type TourState } from "../tour-state"

const TOUR_EVENT = "admission:tour"

/** True while the welcome card or a tour stop is on screen; follows `useTour` updates in the same tab. */
export function useTourOpen(key: string) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const read = () => {
      const status = loadTour(window.localStorage, key).status
      setOpen(status === "intro" || status === "touring")
    }
    read()
    window.addEventListener(TOUR_EVENT, read)
    return () => window.removeEventListener(TOUR_EVENT, read)
  }, [key])
  return open
}

/** The tour state of one student, kept in localStorage; `null` until it has been read on the client. */
export function useTour(key: string) {
  const [state, setState] = useState<TourState | null>(null)
  useEffect(() => setState(loadTour(window.localStorage, key)), [key])
  const update = useCallback(
    (change: (state: TourState) => TourState) =>
      setState((prev) => {
        const next = change(prev ?? INITIAL_TOUR)
        if (next !== prev) {
          saveTour(window.localStorage, key, next)
          queueMicrotask(() => window.dispatchEvent(new Event(TOUR_EVENT)))
        }
        return next
      }),
    [key],
  )
  return [state, update] as const
}
