/**
 * Wire types of the fit endpoints (`GET /list/fit`, `GET|PUT /me/fit-preferences`). They mirror the frozen backend
 * contract; swap for the generated ones when `sync:openapi` brings them.
 */
export type AxisKey = "afford" | "goals" | "profile" | "traits"

/** A step that moves an axis; `gain` is in points of that axis. */
export type FitRaise = { label: string; href: string; gain: number }

export type FitAxis = {
  key: AxisKey
  /** 0..100, `null` when the data is missing. */
  score: number | null
  weight: number
  why: string[]
  raise: FitRaise[]
}

export type FitItem = {
  list_entry_id: string
  institution_id: string
  /** 0..100 over the known axes; `null` when no axis is known. */
  total: number | null
  /** 0..1 share of the ring weight whose data is known; absent from older servers. */
  known_share?: number
  axes: FitAxis[]
}

export type FitList = { weights: Record<AxisKey, number>; items: FitItem[] }

export const RATING_KEYS = [
  "price",
  "salary",
  "ai_resilience",
  "prestige",
  "academics",
  "social",
  "city",
  "home",
] as const
export type RatingKey = (typeof RATING_KEYS)[number]
export type Ratings = Record<RatingKey, number>

export type FitPreferences = {
  ratings: Ratings
  weights: Record<AxisKey, number>
  updated_at: string | null
}

/** `POST /fit/{institution_id}/analysis`: the ring after the quick AI correction, and a short text. */
export type FitAnalysisAxis = { key: AxisKey; base_score: number | null; score: number | null }

export type FitAnalysis = {
  base_total: number | null
  total: number | null
  known_share: number
  axes: FitAnalysisAxis[]
  strengths: string[]
  risks: string[]
  next_step: string
  /** `false` without AI consent: the values are the rule-based ones and the text is empty. */
  ai: boolean
}
