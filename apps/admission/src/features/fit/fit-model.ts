import type { Icons } from "@ihsp/ui"

/** The four metrics of the fit ring, in ring order (clockwise from 12 o'clock). */
export const METRIC_IDS = ["afford", "goals", "profile", "traits"] as const
export type MetricId = (typeof METRIC_IDS)[number]

/** Icon and token colour of a metric. Colours are `--fit-*` tokens (Okabe-Ito based, colour-blind safe, see fit.css). */
export const METRIC_STYLE: Record<MetricId, { icon: keyof typeof Icons; color: string }> = {
  afford: { icon: "creditCard", color: "var(--fit-afford)" },
  goals: { icon: "target", color: "var(--fit-goals)" },
  profile: { icon: "grades", color: "var(--fit-profile)" },
  traits: { icon: "heart", color: "var(--fit-traits)" },
}

/** Default weights of the model (ikigai research §3). The student changes them on the weights page. */
export const DEFAULT_WEIGHTS: Record<MetricId, number> = { afford: 0.25, goals: 0.3, profile: 0.3, traits: 0.15 }

/** A translated line: `key` under the `fit` namespace plus its placeholders. */
export type Line = { key: string; params?: Record<string, string | number> }

/** One step that would raise a metric: the gain is in points of the composite, `href` is where the work is done. */
export type Move = {
  id: string
  metric: MetricId
  line: Line
  gain: number
  time: { n: number; unit: "min" | "week" }
  href: string
}

export type MetricResult = {
  id: MetricId
  /** 0-100, or `null` when the data is missing (drawn distinctly, never as zero). */
  score: number | null
  /** The "why" lines; at most two. */
  why: Line[]
}

export type UniFit = { metrics: MetricResult[]; moves: Move[] }

export function normalise(weights: Record<MetricId, number>): Record<MetricId, number> {
  const total = METRIC_IDS.reduce((sum, id) => sum + weights[id], 0) || 1
  return Object.fromEntries(METRIC_IDS.map((id) => [id, weights[id] / total])) as Record<MetricId, number>
}

/** The composite over the known metrics (weights renormalised), 0-100, and the share of the weight that is known. */
export function composite(metrics: MetricResult[], weights: Record<MetricId, number>) {
  const w = normalise(weights)
  let sum = 0
  let known = 0
  for (const metric of metrics) {
    if (metric.score === null) continue
    sum += w[metric.id] * metric.score
    known += w[metric.id]
  }
  return { value: known > 0 ? Math.round(sum / known) : null, known }
}

/** Points the composite gains if `metric` rises by `delta` sub-score points (known weights renormalised). */
export function gainOf(metrics: MetricResult[], weights: Record<MetricId, number>, metric: MetricId, delta: number) {
  const w = normalise(weights)
  const known = metrics.reduce((sum, m) => sum + (m.score === null ? 0 : w[m.id]), 0) || 1
  return Math.round((w[metric] * delta) / known)
}

/** Points the composite gains when a missing metric becomes known at `assumed`, or a known one rises by `delta`. */
export function gainIfFilled(metrics: MetricResult[], weights: Record<MetricId, number>, id: MetricId, assumed: number) {
  const before = composite(metrics, weights).value ?? 0
  const after = composite(
    metrics.map((m) => (m.id === id ? { ...m, score: assumed } : m)),
    weights,
  ).value
  return Math.max((after ?? 0) - before, 0)
}
