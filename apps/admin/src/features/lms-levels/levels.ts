import type { LevelCurve, LevelTier, LocalizedName } from "./api"

export const MAX_LEVEL = 16
export const LOCALES = ["ru", "uz", "en"] as const

/** XP needed to reach `level` on the scheme's curve (the backend's table or quadratic `base · l · (l−1)`). */
export function xpToReach(level: number, curve: LevelCurve): number {
  if (curve.kind === "table") return curve.steps?.[level - 1] ?? 0
  return (curve.base ?? 50) * level * (level - 1)
}

/** Name of a scheme or title of a tier in the current language, falling back to any filled one. */
export function pick(value: LocalizedName, locale: string): string {
  return value[locale] || value.ru || Object.values(value).find((v) => v) || ""
}

export function tierOf(level: number, tiers: LevelTier[]): LevelTier | undefined {
  let found = tiers[0]
  for (const tier of tiers) if (tier.level_from <= level) found = tier
  return found
}

export type Check = { id: "contiguous" | "increasing" | "titles"; ok: boolean }

/** The invariants of the scheme: tiers start at level 1, strictly increase, titles filled. */
export function checks(tiers: LevelTier[]): Check[] {
  const increasing = tiers.every((tier, index) => index === 0 || tier.level_from > tiers[index - 1]!.level_from)
  return [
    { id: "contiguous", ok: tiers[0]?.level_from === 1 },
    { id: "increasing", ok: increasing },
    { id: "titles", ok: tiers.every((tier) => LOCALES.every((l) => (tier.title[l] ?? "").trim() !== "")) },
  ]
}

/** Learners at a level (0 when nobody is there). */
export function countAt(counts: Record<string, number>, level: number): number {
  return counts[String(level)] ?? 0
}

export function sameTiers(a: LevelTier[], b: LevelTier[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
