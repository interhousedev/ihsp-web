import type { FactSpecItem } from "./api"

export type DeadlineDraft = {
  plan: string
  date: string
  cycle: string
  binding: "" | "yes" | "no"
  time_zone: string
  note: string
}

export type RankingDraft = { system: string; subject: string; rank: string; year: string; source_url: string }

export type FocusDraft = {
  en: string
  ru: string
  uz: string
  quote: string
  source_url: string
  fetched_at: string
  verified: boolean
}

export const EMPTY_FOCUS: FocusDraft = {
  en: "",
  ru: "",
  uz: "",
  quote: "",
  source_url: "",
  fetched_at: "",
  verified: false,
}

export const RANK_SYSTEMS = ["qs", "the", "arwu", "usnews"] as const

export const RANKING_SUBJECTS = [
  "overall",
  "architecture",
  "architecture_planning",
  "arts_design",
  "arts_humanities",
  "biology",
  "biomedical_engineering",
  "business",
  "business_economics",
  "chemical_engineering",
  "chemistry",
  "computer_data",
  "computer_science",
  "data_science",
  "economics",
  "education",
  "engineering",
  "environment",
  "humanities",
  "law",
  "law_politics",
  "life_health",
  "life_sciences",
  "management",
  "mathematics",
  "medicine",
  "natural_sciences",
  "physics",
  "politics",
  "psychology",
  "social_sciences",
  "taxation",
] as const

export const EMPTY_RANKING: RankingDraft = { system: "qs", subject: "overall", rank: "", year: "", source_url: "" }

export const EXPERIENCE_PARTS = ["social", "research", "work"] as const

/** What the inputs of one fact hold: text, a picked list, named numbers or the deadline and ranking rows. */
export type Draft = string | string[] | Record<string, string> | DeadlineDraft[] | RankingDraft[] | FocusDraft[]

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
    case "rankings":
    case "focuses":
      return []
    case "range":
    case "experience_scores":
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
    case "url":
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
    case "experience_scores": {
      const record = draft as Record<string, string>
      const out: Record<string, unknown> = {}
      for (const part of EXPERIENCE_PARTS) {
        const value = num(record[part])
        if (value !== null) out[part] = value
      }
      if (Object.keys(out).length === 0) return undefined
      if (record.notes) out.notes = JSON.parse(record.notes)
      return out
    }
    case "focuses": {
      const rows = (draft as FocusDraft[])
        .filter(
          (row) =>
            row.en.trim() &&
            row.ru.trim() &&
            row.uz.trim() &&
            row.quote.trim() &&
            isHttpsUrl(row.source_url.trim()) &&
            row.fetched_at.trim(),
        )
        .map((row) => ({
          text: { en: row.en.trim(), ru: row.ru.trim(), uz: row.uz.trim() },
          quote: row.quote.trim(),
          source_url: row.source_url.trim(),
          fetched_at: row.fetched_at.trim(),
          verified: row.verified,
        }))
      return rows.length > 0 ? rows : undefined
    }
    case "rankings": {
      const rows = (draft as RankingDraft[])
        .filter((row) => row.system && row.subject && row.rank.trim() && row.year.trim())
        .map((row) => {
          const rank = row.rank.trim()
          return {
            system: row.system,
            subject: row.subject,
            rank: /^\d+$/.test(rank) ? Number(rank) : rank,
            year: Number(row.year),
            source_url: row.source_url.trim(),
          }
        })
      return rows.length > 0 ? rows : undefined
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

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function textOf(value: unknown): string {
  return typeof value === "number" || typeof value === "string" ? String(value) : ""
}

function textRecord(value: unknown): Record<string, string> | null {
  const source = record(value)
  if (!source) return null
  return Object.fromEntries(Object.entries(source).map(([key, entry]) => [key, textOf(entry)]))
}

/** The draft that holds a stored value, or `undefined` when the value does not fit the kind of the fact. */
export function draftFromValue(item: FactSpecItem, value: unknown): Draft | undefined {
  if (value === null || value === undefined) return undefined
  switch (item.kind) {
    case "bool":
      return typeof value === "boolean" ? (value ? "yes" : "no") : undefined
    case "int":
    case "percent":
      return typeof value === "number" ? String(value) : undefined
    case "money": {
      const money = record(value)
      if (money) return { amount: textOf(money.amount), currency: textOf(money.currency).toUpperCase() }
      return typeof value === "number"
        ? { amount: String(value), currency: isUsdFact(item) ? "USD" : (item.unit ?? "").toUpperCase() }
        : undefined
    }
    case "date":
    case "text":
    case "url":
    case "enum":
      return typeof value === "string" ? value : undefined
    case "experience_scores": {
      const source = record(value)
      if (!source) return undefined
      const out: Record<string, string> = {}
      for (const part of EXPERIENCE_PARTS) out[part] = textOf(source[part])
      if (source.notes) out.notes = JSON.stringify(source.notes)
      return out
    }
    case "focuses":
      return Array.isArray(value)
        ? value.map((entry) => {
            const row = record(entry) ?? {}
            const text = textRecord(row.text) ?? {}
            return {
              en: text.en ?? "",
              ru: text.ru ?? "",
              uz: text.uz ?? "",
              quote: textOf(row.quote),
              source_url: textOf(row.source_url),
              fetched_at: textOf(row.fetched_at),
              verified: row.verified === true,
            } satisfies FocusDraft
          })
        : undefined
    case "rankings":
      return Array.isArray(value)
        ? value.map((entry) => {
            const row = record(entry) ?? {}
            return {
              system: textOf(row.system),
              subject: textOf(row.subject),
              rank: textOf(row.rank),
              year: textOf(row.year),
              source_url: textOf(row.source_url),
            } satisfies RankingDraft
          })
        : undefined
    case "multi":
    case "study_fields":
      return Array.isArray(value) ? value.map(String) : undefined
    case "range": {
      const range = textRecord(value)
      return range ? { min: range.min ?? "", max: range.max ?? "" } : undefined
    }
    case "scores":
    case "factors":
      return textRecord(value) ?? undefined
    case "deadlines":
      return Array.isArray(value)
        ? value.map((entry) => {
            const row = record(entry) ?? {}
            return {
              plan: textOf(row.plan),
              date: textOf(row.date),
              cycle: textOf(row.cycle),
              binding: typeof row.binding === "boolean" ? (row.binding ? "yes" : "no") : "",
              time_zone: textOf(row.time_zone),
              note: textOf(row.note),
            } satisfies DeadlineDraft
          })
        : undefined
    default:
      return undefined
  }
}

/** The facts an existing school already has, as drafts with their citation; `rows` are the rows of its detail view. */
export function factsFromRows(
  groups: { facts: FactSpecItem[] }[],
  rows: { key: string; value: unknown; source_url: string | null; year: number | null }[],
): FactsState {
  const specs = new Map(groups.flatMap((group) => group.facts).map((item) => [item.key, item]))
  const facts: Record<string, FactEntry> = {}
  for (const row of rows) {
    const item = specs.get(row.key)
    const draft = item ? draftFromValue(item, row.value) : undefined
    if (!item || draft === undefined) continue
    facts[row.key] = { draft, url: row.source_url ?? "", year: row.year ? String(row.year) : currentYear(), note: "" }
  }
  return { facts, sections: {} }
}

export type BuiltFacts = {
  facts: Record<string, { value: unknown; source_url: string; year: number; note?: string | null }>
  /** Keys of filled facts whose citation is not a valid https link and year. */
  incomplete: string[]
}

/** The facts to send: only filled ones that differ from the `baseline` (the school's current facts), each with its citation. */
export function buildFacts(
  groups: { key: string; facts: FactSpecItem[] }[],
  state: FactsState,
  baseline: FactsState = EMPTY_FACTS,
): BuiltFacts {
  const facts: BuiltFacts["facts"] = {}
  const incomplete: string[] = []
  for (const group of groups) {
    for (const item of group.facts) {
      const entry = state.facts[item.key]
      const value = serializeDraft(item, entry?.draft)
      if (value === undefined) continue
      const cite = effectiveCitation(entry, state.sections[group.key])
      const before = baseline.facts[item.key]
      if (
        before &&
        JSON.stringify(serializeDraft(item, before.draft)) === JSON.stringify(value) &&
        before.url.trim() === cite.url.trim() &&
        before.year === cite.year &&
        before.note.trim() === cite.note.trim()
      ) {
        continue
      }
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
