/**
 * Two ways to say what matters, both reduced to the fit model's four weights (afford, goals, profile, traits).
 * Pure functions only; the pickers and the page live in ./components. The fit model normalises, so the maps below
 * need not sum to one, but every column does, which keeps the numbers easy to reason about.
 *
 * (a) TRIANGLE. A point inside a triangle is three barycentric weights (social, study, profession; sum 1). Each
 * corner is a blend of the four fit weights:
 *
 *              afford  goals  profile  traits
 *   social      0.20    0.00    0.10     0.70   (campus life, people, "will I be happy there")
 *   study       0.10    0.10    0.70     0.10   (academic bar and my profile against it)
 *   profession  0.20    0.60    0.10     0.10   (goals, ikigai, AI-risk of the career; cost as an investment)
 *
 *   fit weights = social * c_social + study * c_study + profession * c_profession
 *
 * (b) RADAR. Seven traits rated 1-10. Each trait feeds one or two fit weights; the raw sums are normalised:
 *
 *              afford  goals  profile  traits
 *   money       1.0     .       .        .
 *   prestige    .       0.5    0.5       .
 *   city        0.3     .       .       0.7     (climate, city size, cost of living)
 *   home        0.5     .       .       0.5     (closeness to family)
 *   career      .       1.0     .        .      (career and AI-risks)
 *   social      .       .       .       1.0
 *   academics   .       .       1.0      .      (academic workload the student is ready for)
 *
 * MOCK: the demo ranks the mock universities of ../fit/mock-fit; nothing is saved.
 */
import { METRIC_IDS, normalise, type MetricId } from "../fit/fit-model"

export type Weights = Record<MetricId, number>

const ZERO: Weights = { afford: 0, goals: 0, profile: 0, traits: 0 }
const mix = (parts: Partial<Weights>): Weights => ({ ...ZERO, ...parts })

// ---------------------------------------------------------------- triangle

export const CORNERS = ["profession", "study", "social"] as const
export type Corner = (typeof CORNERS)[number]
export type Bary = Record<Corner, number>

const CORNER_MIX: Record<Corner, Weights> = {
  social: mix({ afford: 0.2, profile: 0.1, traits: 0.7 }),
  study: mix({ afford: 0.1, goals: 0.1, profile: 0.7, traits: 0.1 }),
  profession: mix({ afford: 0.2, goals: 0.6, profile: 0.1, traits: 0.1 }),
}

export const CENTRE: Bary = { profession: 1 / 3, study: 1 / 3, social: 1 / 3 }

export function triangleToWeights(b: Bary): Weights {
  const out = { ...ZERO }
  for (const corner of CORNERS) {
    for (const id of METRIC_IDS) out[id] += b[corner] * CORNER_MIX[corner][id]
  }
  return normalise(out)
}

export type Pt = { x: number; y: number }
/** Triangle vertices in SVG units (profession on top, study bottom left, social bottom right). */
export const VERTEX: Record<Corner, Pt> = {
  profession: { x: 160, y: 36 },
  study: { x: 40, y: 244 },
  social: { x: 280, y: 244 },
}

export function baryToPoint(b: Bary): Pt {
  return {
    x: b.profession * VERTEX.profession.x + b.study * VERTEX.study.x + b.social * VERTEX.social.x,
    y: b.profession * VERTEX.profession.y + b.study * VERTEX.study.y + b.social * VERTEX.social.y,
  }
}

/** Barycentric coordinates of a point; a point outside the triangle is pulled to its nearest edge. */
export function pointToBary(p: Pt): Bary {
  const { profession: a, study: b, social: c } = VERTEX
  const det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)
  const wa = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / det
  const wb = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / det
  const clamped = [wa, wb, 1 - wa - wb].map((v) => Math.max(v, 0))
  const total = clamped[0]! + clamped[1]! + clamped[2]!
  return { profession: clamped[0]! / total, study: clamped[1]! / total, social: clamped[2]! / total }
}

/** Snap targets: the centre, the three corners and the three edge midpoints. */
export const SNAPS: Bary[] = [
  CENTRE,
  { profession: 1, study: 0, social: 0 },
  { profession: 0, study: 1, social: 0 },
  { profession: 0, study: 0, social: 1 },
  { profession: 0.5, study: 0.5, social: 0 },
  { profession: 0.5, study: 0, social: 0.5 },
  { profession: 0, study: 0.5, social: 0.5 },
]

/** The snap target within `radius` SVG units of `p`, else null. */
export function snapTo(p: Pt, radius: number): Bary | null {
  let best: Bary | null = null
  let bestDistance = radius
  for (const snap of SNAPS) {
    const q = baryToPoint(snap)
    const d = Math.hypot(q.x - p.x, q.y - p.y)
    if (d <= bestDistance) {
      best = snap
      bestDistance = d
    }
  }
  return best
}

export function sameBary(a: Bary, b: Bary) {
  return CORNERS.every((corner) => Math.abs(a[corner] - b[corner]) < 1e-6)
}

/** The corners that lead, for the sentence in plain words: all three when balanced, else one or two. */
export function leadingCorners(b: Bary): Corner[] {
  const sorted = [...CORNERS].sort((x, y) => b[y] - b[x])
  const [first, second, third] = sorted as [Corner, Corner, Corner]
  if (b[first] - b[third] < 0.12) return []
  return b[first] - b[second] < 0.12 ? [first, second] : [first]
}

// ---------------------------------------------------------------- radar

export const TRAITS = ["money", "prestige", "city", "home", "career", "social", "academics"] as const
export type TraitId = (typeof TRAITS)[number]
export type Ratings = Record<TraitId, number>

export const RATING_MIN = 1
export const RATING_MAX = 10

const TRAIT_MIX: Record<TraitId, Weights> = {
  money: mix({ afford: 1 }),
  prestige: mix({ goals: 0.5, profile: 0.5 }),
  city: mix({ afford: 0.3, traits: 0.7 }),
  home: mix({ afford: 0.5, traits: 0.5 }),
  career: mix({ goals: 1 }),
  social: mix({ traits: 1 }),
  academics: mix({ profile: 1 }),
}

export function radarToWeights(r: Ratings): Weights {
  const out = { ...ZERO }
  for (const trait of TRAITS) {
    for (const id of METRIC_IDS) out[id] += r[trait] * TRAIT_MIX[trait][id]
  }
  return normalise(out)
}

export const DEFAULT_RATINGS: Ratings = { money: 8, prestige: 5, city: 6, home: 4, career: 7, social: 5, academics: 6 }

export function clampRating(value: number) {
  return Math.min(Math.max(Math.round(value), RATING_MIN), RATING_MAX)
}

/** The traits rated highest, ties kept in axis order; only those within one point of the top, at most `max`. */
export function topTraits(r: Ratings, max = 2): TraitId[] {
  const sorted = [...TRAITS].sort((a, b) => r[b] - r[a])
  const top = r[sorted[0]!]
  return sorted.filter((trait) => r[trait] >= top - 1).slice(0, max)
}

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
