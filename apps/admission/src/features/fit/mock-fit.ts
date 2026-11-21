/**
 * MOCK ADAPTER. Scores, costs and reasons below are invented demo data, not a model output; the real fit endpoint does
 * not exist yet. Everything the UI shows about fit comes through `buildFit`, so wiring the API replaces this file only.
 */
import {
  DEFAULT_WEIGHTS,
  gainIfFilled,
  gainOf,
  type MetricId,
  type MetricResult,
  type Move,
  type UniFit,
} from "./fit-model"

type Raw = {
  /** Sub-scores [afford, goals, profile, traits] when every axis is known. */
  scores: [number, number, number, number]
  net: string
  sticker: string
  gap: string | null
  need: string
  have: string
  prof: string
  risk: "low" | "mid" | "high"
  trait: string
}

/** Which axes the student has not filled yet: the demo's "grey segments". */
export type Missing = Partial<Record<MetricId, true>>

const ORDER: MetricId[] = ["afford", "goals", "profile", "traits"]

export function buildFit(raw: Raw, missing: Missing): UniFit {
  const metrics: MetricResult[] = ORDER.map((id, index): MetricResult => {
    const known = !missing[id]
    const score = known ? raw.scores[index]! : null
    if (id === "afford") {
      return {
        id,
        score,
        why: !known
          ? [{ key: "afford.none" }]
          : [
              raw.gap
                ? { key: "afford.gap", params: { net: raw.net, gap: raw.gap } }
                : { key: "afford.ok", params: { net: raw.net } },
              { key: "afford.aid", params: { sticker: raw.sticker, net: raw.net } },
            ],
      }
    }
    if (id === "goals") {
      return {
        id,
        score,
        why: !known
          ? [{ key: "goals.none" }]
          : [
              { key: "goals.match", params: { prof: `@prof.${raw.prof}` } },
              { key: `goals.risk.${raw.risk}`, params: { prof: `@prof.${raw.prof}` } },
            ],
      }
    }
    if (id === "profile") {
      return {
        id,
        score,
        why: !known
          ? [{ key: "profile.none" }]
          : [
              score! >= 70
                ? { key: "profile.ok" }
                : { key: "profile.reach", params: { need: raw.need, have: raw.have } },
              { key: "profile.field" },
            ],
      }
    }
    return {
      id,
      score,
      why: !known
        ? [{ key: "traits.none" }]
        : [score! >= 65 ? { key: "traits.fit", params: { trait: `@trait.${raw.trait}` } } : { key: "traits.mismatch", params: { trait: `@trait.${raw.trait}` } }],
    }
  })
  const moves: Move[] = []
  for (const metric of metrics) {
    const score = metric.score
    if (metric.id === "goals" && score === null) {
      moves.push({ id: "career", metric: "goals", line: { key: "career" }, gain: gainIfFilled(metrics, DEFAULT_WEIGHTS, "goals", 70), time: { n: 15, unit: "min" }, href: "/career/?tab=field" })
    } else if (metric.id === "traits" && score === null) {
      moves.push({ id: "traits", metric: "traits", line: { key: "traits" }, gain: gainIfFilled(metrics, DEFAULT_WEIGHTS, "traits", 70), time: { n: 10, unit: "min" }, href: "/career/?tab=explore" })
    } else if (metric.id === "profile" && score !== null && score < 70) {
      moves.push({ id: "ielts", metric: "profile", line: { key: "ielts", params: { need: raw.need } }, gain: gainOf(metrics, DEFAULT_WEIGHTS, "profile", 12), time: { n: 6, unit: "week" }, href: "/tests/" })
    } else if (metric.id === "afford" && score !== null && score < 70) {
      moves.push({ id: "aid", metric: "afford", line: { key: "aid" }, gain: gainOf(metrics, DEFAULT_WEIGHTS, "afford", 10), time: { n: 15, unit: "min" }, href: "/chooser/" })
    }
  }
  moves.sort((a, b) => b.gain - a.gain)
  return { metrics, moves: moves.slice(0, 3) }
}

export type MockUniId = "stanford" | "columbia" | "koc" | "bocconi" | "yale" | "wiut"

export type MockUni = {
  id: MockUniId
  name: string
  short: string
  /** Matches the name of a real list entry, to borrow its logo. */
  logoMatch: RegExp
  home?: boolean
  raw: Raw
}

export const MOCK_UNIS: MockUni[] = [
  { id: "stanford", name: "Stanford University", short: "Stanford", logoMatch: /stanford/i, raw: { scores: [38, 80, 45, 70], net: "$38k", sticker: "$92k", gap: "$14k", need: "7.5", have: "6.5", prof: "data", risk: "low", trait: "promo" } },
  { id: "columbia", name: "Columbia University", short: "Columbia", logoMatch: /columbia/i, raw: { scores: [42, 74, 52, 66], net: "$41k", sticker: "$95k", gap: "$17k", need: "7.5", have: "6.5", prof: "econ", risk: "mid", trait: "team" } },
  { id: "koc", name: "Koç University", short: "Koç", logoMatch: /ko[cç]/i, raw: { scores: [82, 68, 78, 55], net: "$9k", sticker: "$26k", gap: null, need: "6.5", have: "6.5", prof: "biomed", risk: "low", trait: "small" } },
  { id: "bocconi", name: "Bocconi University", short: "Bocconi", logoMatch: /bocconi/i, raw: { scores: [70, 72, 74, 60], net: "$16k", sticker: "$21k", gap: null, need: "6.5", have: "6.5", prof: "econ", risk: "mid", trait: "team" } },
  { id: "yale", name: "Yale University", short: "Yale", logoMatch: /yale/i, raw: { scores: [40, 76, 50, 58], net: "$40k", sticker: "$94k", gap: "$16k", need: "7.5", have: "6.5", prof: "data", risk: "low", trait: "promo" } },
  { id: "wiut", name: "WIUT, Ташкент", short: "WIUT", logoMatch: /westminster|wiut/i, home: true, raw: { scores: [95, 70, 92, 64], net: "$4k", sticker: "$5k", gap: null, need: "6.0", have: "6.5", prof: "data", risk: "low", trait: "team" } },
]
