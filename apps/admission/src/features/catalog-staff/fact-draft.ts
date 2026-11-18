import type { FactSpecItem } from "./api"

export type DeadlineDraft = {
  plan: string
  date: string
  cycle: string
  binding: "" | "yes" | "no"
  time_zone: string
  note: string
}

/** What the inputs of one fact hold: text, a picked list, named numbers or the deadline rows. */
export type Draft = string | string[] | Record<string, string> | DeadlineDraft[]

export const PLANS = ["ED", "ED2", "EA", "REA", "SCEA", "RD", "ROLLING", "OTHER"] as const

export const EMPTY_DEADLINE: DeadlineDraft = { plan: "RD", date: "", cycle: "", binding: "", time_zone: "", note: "" }

export function isUsdFact(item: FactSpecItem): boolean {
  return item.unit === "USD" || item.key.endsWith("_usd")
}

/** The empty draft of a kind. */
export function emptyDraft(item: FactSpecItem): Draft {
  switch (item.kind) {
    case "multi":
    case "study_fields":
    case "deadlines":
      return []
    case "range":
    case "money":
    case "scores":
    case "factors":
      return {}
    default:
      return ""
  }
}

function num(text: string | undefined): number | null {
  if (text === undefined || text.trim() === "") return null
  const value = Number(text.replace(",", "."))
  return Number.isFinite(value) ? value : null
}

/** The value to send for a draft, or `undefined` when nothing (or not enough) was filled: guesses are never sent. */
export function serializeDraft(item: FactSpecItem, draft: Draft | undefined): unknown {
  if (draft === undefined) return undefined
  switch (item.kind) {
    case "bool":
      return draft === "yes" ? true : draft === "no" ? false : undefined
    case "int":
    case "percent":
      return typeof draft === "string" ? (num(draft) ?? undefined) : undefined
    case "money": {
      const record = draft as Record<string, string>
      const amount = num(record.amount)
      const currency = isUsdFact(item) ? "USD" : (record.currency ?? "").trim().toUpperCase()
      return amount === null || currency === "" ? undefined : { amount, currency }
    }
    case "date":
    case "text":
    case "enum":
      return typeof draft === "string" && draft.trim() !== "" ? draft.trim() : undefined
    case "multi":
    case "study_fields":
      return Array.isArray(draft) && draft.length > 0 ? draft : undefined
    case "range": {
      const record = draft as Record<string, string>
      const min = num(record.min)
      const max = num(record.max)
      return min === null || max === null ? undefined : { min, max }
    }
    case "scores": {
      const out: Record<string, number> = {}
      for (const [part, text] of Object.entries(draft as Record<string, string>)) {
        const value = num(text)
        if (value !== null) out[part] = value
      }
      return Object.keys(out).length > 0 ? out : undefined
    }
    case "factors": {
      const out: Record<string, string> = {}
      for (const [part, level] of Object.entries(draft as Record<string, string>)) if (level) out[part] = level
      return Object.keys(out).length > 0 ? out : undefined
    }
    case "deadlines": {
      const rows = (draft as DeadlineDraft[])
        .filter((row) => row.plan && row.date && row.cycle)
        .map((row) => ({
          plan: row.plan,
          date: row.date,
          cycle: row.cycle,
          ...(row.binding ? { binding: row.binding === "yes" } : {}),
          ...(row.time_zone.trim() ? { time_zone: row.time_zone.trim() } : {}),
          ...(row.note.trim() ? { note: row.note.trim() } : {}),
        }))
      return rows.length > 0 ? rows : undefined
    }
    default:
      return undefined
  }
}

/** A readable one-line text of a stored or proposed value. `label` maps an option value or part key to its text. */
export function factText(item: FactSpecItem | undefined, value: unknown, label: (key: string) => string): string {
  if (typeof value === "boolean") return label(value ? "yes" : "no")
  if (Array.isArray(value)) {
    return value
      .map((entry: unknown) => {
        if (typeof entry !== "object" || entry === null) return label(String(entry))
        const plan = "plan" in entry ? String(entry.plan) : ""
        const date = "date" in entry ? String(entry.date) : ""
        return `${plan} ${date}`.trim()
      })
      .join(", ")
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>
    if ("amount" in record) return `${record.amount} ${record.currency ?? ""}`.trim()
    if ("min" in record && "max" in record) {
      const unit = item?.unit === "percent" ? "%" : ""
      return record.min === record.max ? `${record.min}${unit}` : `${record.min}-${record.max}${unit}`
    }
    return Object.entries(record)
      .map(([part, entry]) => `${label(part)} ${typeof entry === "string" ? label(entry) : String(entry)}`)
      .join(" · ")
  }
  if (typeof value === "number" && item?.unit === "percent") return `${value}%`
  return typeof value === "string" ? label(value) : String(value)
}

export type Citation = { url: string; year: string; note: string }
export type FactEntry = Citation & { draft: Draft }
export type SectionSource = Citation & { same: boolean }
export type FactsState = { facts: Record<string, FactEntry>; sections: Record<string, SectionSource> }

export const EMPTY_FACTS: FactsState = { facts: {}, sections: {} }

export function currentYear(): string {
  return String(new Date().getFullYear())
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value.trim()).protocol === "https:"
  } catch {
    return false
  }
}

export function emptyCitation(): Citation {
  return { url: "", year: currentYear(), note: "" }
}

/** The citation that applies to a fact: the section's shared one when "same source" is on, otherwise its own. */
export function effectiveCitation(entry: FactEntry | undefined, section: SectionSource | undefined): Citation {
  return section?.same ? section : (entry ?? emptyCitation())
}

export type BuiltFacts = {
  facts: Record<string, { value: unknown; source_url: string; year: number; note?: string | null }>
  /** Keys of filled facts whose citation is not a valid https link and year. */
  incomplete: string[]
}

/** The facts to send: only filled ones, each with its citation. */
export function buildFacts(groups: { key: string; facts: FactSpecItem[] }[], state: FactsState): BuiltFacts {
  const facts: BuiltFacts["facts"] = {}
  const incomplete: string[] = []
  for (const group of groups) {
    for (const item of group.facts) {
      const entry = state.facts[item.key]
      const value = serializeDraft(item, entry?.draft)
      if (value === undefined) continue
      const cite = effectiveCitation(entry, state.sections[group.key])
      const year = Number(cite.year)
      if (!isHttpsUrl(cite.url) || !Number.isInteger(year) || year < 1900 || year > 2100) {
        incomplete.push(item.key)
        continue
      }
      facts[item.key] = { value, source_url: cite.url.trim(), year, note: cite.note.trim() || null }
    }
  }
  return { facts, incomplete }
}

/** How many facts of a group have a value. */
export function filledCount(items: FactSpecItem[], state: FactsState): number {
  return items.filter((item) => serializeDraft(item, state.facts[item.key]?.draft) !== undefined).length
}
