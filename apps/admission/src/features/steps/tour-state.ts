/** One stop of the guided tour: the page it leads to and the sidebar link it highlights there. */
export type TourStop = { id: string; href: string }

/** The pages of the applicant flow in the order a new student needs them. Messages: `tour.steps.<id>.{title,text}`. */
export const TOUR_STOPS: readonly TourStop[] = [
  { id: "home", href: "/" },
  { id: "journey", href: "/journey/" },
  { id: "profile", href: "/setup/" },
  { id: "activities", href: "/activities/" },
  { id: "plans", href: "/plan/" },
  { id: "universities", href: "/chooser/" },
  { id: "documents", href: "/documents/" },
]

export type TourPoint = { x: number; y: number }

/**
 * `intro`: the welcome card. `touring`: a stop is shown. `collapsed`: a small circle that keeps the step.
 * `done`: finished or skipped; never shown again.
 */
export type TourStatus = "intro" | "touring" | "collapsed" | "done"

export type TourState = {
  status: TourStatus
  /** Index into `TOUR_STOPS`; kept while collapsed so the tour resumes where it stopped. */
  step: number
  /** Where the student dragged the card and the circle to (viewport pixels of the top-left corner). */
  card: TourPoint | null
  dot: TourPoint | null
}

export const INITIAL_TOUR: TourState = { status: "intro", step: 0, card: null, dot: null }

export const tourKey = (userId: string | undefined) => `admission.tour.v1.${userId ?? "anon"}`

const STATUSES: readonly TourStatus[] = ["intro", "touring", "collapsed", "done"]

const point = (value: unknown): TourPoint | null => {
  const p = value as Partial<TourPoint> | null
  return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? { x: p.x as number, y: p.y as number } : null
}

/** Reads the saved state; anything unreadable gives a first-run state. */
export function loadTour(storage: Pick<Storage, "getItem">, key: string): TourState {
  try {
    const raw = JSON.parse(storage.getItem(key) ?? "null") as Partial<TourState> | null
    if (!raw || !STATUSES.includes(raw.status as TourStatus)) return INITIAL_TOUR
    const step = Math.min(Math.max(Math.trunc(Number(raw.step)) || 0, 0), TOUR_STOPS.length - 1)
    return { status: raw.status as TourStatus, step, card: point(raw.card), dot: point(raw.dot) }
  } catch {
    return INITIAL_TOUR
  }
}

export function saveTour(storage: Pick<Storage, "setItem">, key: string, state: TourState) {
  try {
    storage.setItem(key, JSON.stringify(state))
  } catch {
    // Private mode or a full quota: the tour still works, it only forgets its place.
  }
}

export const tourReducers = {
  start: (s: TourState): TourState => ({ ...s, status: "touring", step: 0 }),
  collapse: (s: TourState): TourState => (s.status === "touring" ? { ...s, status: "collapsed" } : s),
  expand: (s: TourState): TourState => (s.status === "collapsed" ? { ...s, status: "touring" } : s),
  next: (s: TourState): TourState =>
    s.step + 1 >= TOUR_STOPS.length ? { ...s, status: "done" } : { ...s, status: "touring", step: s.step + 1 },
  back: (s: TourState): TourState => ({ ...s, status: "touring", step: Math.max(s.step - 1, 0) }),
  finish: (s: TourState): TourState => ({ ...s, status: "done" }),
  moveCard: (s: TourState, card: TourPoint): TourState => ({ ...s, card }),
  moveDot: (s: TourState, dot: TourPoint): TourState => ({ ...s, dot }),
}
