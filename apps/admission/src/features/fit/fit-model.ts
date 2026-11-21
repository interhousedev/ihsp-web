import type { Icons } from "@ihsp/ui"
import type { AxisKey, FitItem, FitRaise } from "./types"

/** The four metrics of the fit ring, in ring order (clockwise from 12 o'clock). */
export const METRIC_IDS = ["afford", "goals", "profile", "traits"] as const satisfies readonly AxisKey[]
export type MetricId = AxisKey

/** Icon and token colour of a metric. Colours are `--fit-*` tokens (Okabe-Ito based, colour-blind safe, see fit.css). */
export const METRIC_STYLE: Record<MetricId, { icon: keyof typeof Icons; color: string }> = {
  afford: { icon: "creditCard", color: "var(--fit-afford)" },
  goals: { icon: "target", color: "var(--fit-goals)" },
  profile: { icon: "grades", color: "var(--fit-profile)" },
  traits: { icon: "heart", color: "var(--fit-traits)" },
}

export type Weights = Record<MetricId, number>

export type MetricResult = {
  id: MetricId
  /** 0-100, or `null` when the data is missing (drawn distinctly, never as zero). */
  score: number | null
  /** Share of the ring this metric owns (the four sum to 1). */
  weight: number
  why: string[]
  raise: FitRaise[]
}

export type UniFit = { total: number | null; metrics: MetricResult[] }

export function normalise(weights: Weights): Weights {
  const sum = METRIC_IDS.reduce((acc, id) => acc + weights[id], 0) || 1
  return Object.fromEntries(METRIC_IDS.map((id) => [id, weights[id] / sum])) as Weights
}

/** The ring view of an API item: the metrics in ring order, a missing axis kept as `null`. */
export function toUniFit(item: Pick<FitItem, "total" | "axes">): UniFit {
  const metrics = METRIC_IDS.map((id): MetricResult => {
    const axis = item.axes.find((candidate) => candidate.key === id)
    return { id, score: axis?.score ?? null, weight: axis?.weight ?? 0, why: axis?.why ?? [], raise: axis?.raise ?? [] }
  })
  return { total: item.total, metrics }
}

/** The weighted mean over the known metrics (weights renormalised): the total for other weights, e.g. a live preview. */
export function totalFor(fit: UniFit, weights: Weights): number | null {
  const w = normalise(weights)
  let sum = 0
  let known = 0
  for (const metric of fit.metrics) {
    if (metric.score === null) continue
    sum += w[metric.id] * metric.score
    known += w[metric.id]
  }
  return known > 0 ? Math.round(sum / known) : null
}

/** Share of the ring weight whose data is known, 0..1. */
export function knownShare(fit: UniFit): number {
  return fit.metrics.reduce((sum, metric) => sum + (metric.score === null ? 0 : metric.weight), 0)
}

/** `total` desc, unknown last, list order kept among equals. */
export function byTotal<T>(rows: readonly T[], total: (row: T) => number | null): T[] {
  return rows
    .map((row, index) => ({ row, index, value: total(row) }))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1) || a.index - b.index)
    .map((entry) => entry.row)
}
