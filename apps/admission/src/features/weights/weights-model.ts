/**
 * "What matters to you": eight qualities rated 1-10 on a radar. The server turns them into the four fit weights
 * (backend `domain/fit.py`, `weights_of`); the same map lives here so the page can re-rank the list while a dot is
 * dragged, before anything is saved:
 *
 *   afford  <- price
 *   goals   <- salary + ai_resilience
 *   profile <- academics + prestige
 *   traits  <- social + city + home
 *
 * then normalised to sum 1. Price and near-future salary are separate axes on purpose: a student can want a cheap
 * degree, a well-paid first job, or both.
 */
import { RATING_KEYS, type RatingKey, type Ratings } from "../fit/types"
import { METRIC_IDS, normalise, type Weights } from "../fit/fit-model"

export type { Ratings } from "../fit/types"
export const TRAITS = RATING_KEYS
export type TraitId = RatingKey

export const RATING_MIN = 1
export const RATING_MAX = 10
export const RATING_DEFAULT = 5
export const DEFAULT_RATINGS: Ratings = Object.fromEntries(RATING_KEYS.map((key) => [key, RATING_DEFAULT])) as Ratings

export function ratingsToWeights(r: Ratings): Weights {
  return normalise({
    afford: r.price,
    goals: r.salary + r.ai_resilience,
    profile: r.academics + r.prestige,
    traits: r.social + r.city + r.home,
  })
}

export function clampRating(value: number) {
  return Math.min(Math.max(Math.round(value), RATING_MIN), RATING_MAX)
}

export function sameRatings(a: Ratings, b: Ratings) {
  return RATING_KEYS.every((key) => a[key] === b[key])
}

/** The traits rated highest, ties kept in axis order; only those within one point of the top, at most `max`. Empty when all are equal. */
export function topTraits(r: Ratings, max = 2): TraitId[] {
  const sorted = [...TRAITS].sort((a, b) => r[b] - r[a])
  const top = r[sorted[0]!]
  const lowest = r[sorted[sorted.length - 1]!]
  if (top - lowest < 2) return []
  return sorted.filter((trait) => r[trait] >= top - 1).slice(0, max)
}

export type Pt = { x: number; y: number }

/** SVG position of an axis at a rating (centre cx, cy; `radius` is the rating 10). Axis 0 points up. */
export function radarPoint(index: number, value: number, radius: number, cx: number, cy: number): Pt {
  const angle = (-90 + (index * 360) / TRAITS.length) * (Math.PI / 180)
  const r = (value / RATING_MAX) * radius
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

/** The axis whose direction is nearest to the point, and the rating its distance from the centre stands for. */
export function pickAxis(p: Pt, radius: number, cx: number, cy: number): { index: number; value: number } {
  const angle = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 90
  const step = 360 / TRAITS.length
  const index = Math.round((((angle % 360) + 360) % 360) / step) % TRAITS.length
  return { index, value: clampRating((Math.hypot(p.x - cx, p.y - cy) / radius) * RATING_MAX) }
}

export { METRIC_IDS }
