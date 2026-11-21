import type { EssaySummary } from "../api"
import type { PromptGroup, PromptRef, PromptScope } from "../flow/api"
import { groupLabel } from "../flow/group-label"

/** One line of the ledger: a prompt group, the essays written for it and what is due. */
export type LedgerRow = {
  group: PromptGroup
  /** The theme of the group in the UI language; the universities line when the server has no name yet. */
  label: string
  essays: EssaySummary[]
  /** The prompts the student has to answer: those of the list and the Common App in "my list", every prompt in "all". */
  prompts: PromptRef[]
  due: { date: string; predicted: boolean } | null
  /** The best uniqueness among the essays, null while none has been read. */
  best: number | null
}

export type LedgerSummary = {
  needed: number
  started: number
  due: { date: string; predicted: boolean } | null
}

const KIND_ORDER = { common: 0, shared: 1, unique: 2 } as const

/** A prompt the student owes: it belongs to a listed university or to the Common App. */
export const isOwed = (p: PromptRef) => p.in_list || p.institution_id === null

/** The earliest of the two dates, either may be missing. */
const earlier = (a: LedgerRow["due"], b: LedgerRow["due"]) => {
  if (!a) return b
  if (!b) return a
  return a.date <= b.date ? a : b
}

/** Joins the prompt map with the student's essays into ledger rows, soonest deadline first, then by the map's kind. */
export function buildLedger(groups: PromptGroup[], essays: EssaySummary[], scope: PromptScope): LedgerRow[] {
  const byId = new Map(essays.map((e) => [e.id, e]))
  const rows = groups.map((group): LedgerRow => {
    const mine = group.essay_ids.flatMap((id) => byId.get(id) ?? [])
    const scores = mine.flatMap((e) => (e.uniqueness === null ? [] : [e.uniqueness]))
    return {
      group,
      label: group.label.trim() || groupLabel(group),
      essays: mine,
      prompts: scope === "list" ? group.prompts.filter(isOwed) : group.prompts,
      due: group.due_utc ? { date: group.due_utc, predicted: group.due_predicted } : null,
      best: scores.length ? Math.max(...scores) : null,
    }
  })
  return rows.sort((a, b) => {
    if (a.due && b.due && a.due.date !== b.due.date) return a.due.date < b.due.date ? -1 : 1
    if (!!a.due !== !!b.due) return a.due ? -1 : 1
    return KIND_ORDER[a.group.kind] - KIND_ORDER[b.group.kind]
  })
}

/** The kinds of essay the ledger groups its rows by, in display order. */
export const ESSAY_TYPES = ["personal", "whyUs", "community", "academic", "activity", "short", "other"] as const
export type EssayType = (typeof ESSAY_TYPES)[number]

const TYPE_OF_CATEGORY: Record<PromptGroup["category"], EssayType> = {
  personal_statement: "personal",
  why_us: "whyUs",
  community: "community",
  academic: "academic",
  activity: "activity",
  short_answer: "short",
  other: "other",
}

/** The type of one prompt group, as the server classifies it. */
export const essayType = (group: PromptGroup): EssayType => TYPE_OF_CATEGORY[group.category]

/** One section of the ledger: the rows of one essay type and how many essays that type needs. */
export type LedgerSection = {
  type: EssayType
  rows: LedgerRow[]
  /** Essays to write: the Common App prompts are alternatives, so they count as one. */
  needed: number
  filled: number
  /** Rows to choose from when only one of them is written (the Common App personal essay), else null. */
  pickOne: number | null
  due: LedgerRow["due"]
}

/** Rows grouped by essay type, each section in the order of its rows (soonest deadline first). */
export function buildSections(rows: LedgerRow[]): LedgerSection[] {
  return ESSAY_TYPES.flatMap((type) => {
    const mine = rows.filter((r) => essayType(r.group) === type)
    if (mine.length === 0) return []
    const started = mine.filter((r) => r.essays.length > 0).length
    const personal = type === "personal"
    return [
      {
        type,
        rows: personal ? [...mine].sort((a, b) => b.essays.length - a.essays.length) : mine,
        needed: personal ? 1 : mine.length,
        filled: personal ? Math.min(started, 1) : started,
        pickOne: personal ? mine.length : null,
        due: mine.reduce<LedgerRow["due"]>((acc, r) => earlier(acc, r.due), null),
      },
    ]
  })
}

/** Rows whose label, prompt text or university contains the query. */
export function filterRows(rows: LedgerRow[], query: string): LedgerRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(
    (r) =>
      r.label.toLowerCase().includes(q) ||
      r.group.prompts.some((p) => p.prompt.toLowerCase().includes(q) || p.institution_name.toLowerCase().includes(q)),
  )
}

/** The distinct universities of a row (the Common App has no university), soonest list entries first. */
export function rowUniversities(row: LedgerRow): { id: string; name: string }[] {
  const seen = new Map<string, string>()
  for (const p of row.group.prompts)
    if (p.institution_id && !seen.has(p.institution_id)) seen.set(p.institution_id, p.institution_name)
  return [...seen].map(([id, name]) => ({ id, name }))
}

export function summarize(sections: LedgerSection[]): LedgerSummary {
  return {
    needed: sections.reduce((n, s) => n + s.needed, 0),
    started: sections.reduce((n, s) => n + s.filled, 0),
    due: sections.reduce<LedgerRow["due"]>((acc, s) => earlier(acc, s.due), null),
  }
}

/** The legacy `?step=` / `?tab=` addresses of the six-step flow and where each one lands now. */
export type LegacyTarget = { lens: "essay" | "uni"; drawer: "ideas" | "examples" | null }

const LEGACY: Record<string, LegacyTarget> = {
  map: { lens: "essay", drawer: null },
  colleges: { lens: "essay", drawer: null },
  practice: { lens: "essay", drawer: null },
  ideas: { lens: "essay", drawer: "ideas" },
  essays: { lens: "essay", drawer: null },
  story: { lens: "essay", drawer: "ideas" },
  gallery: { lens: "essay", drawer: "examples" },
  examples: { lens: "essay", drawer: "examples" },
  deep: { lens: "essay", drawer: null },
  alignment: { lens: "essay", drawer: null },
  match: { lens: "uni", drawer: null },
}

export function legacyTarget(step: string | null, tab: string | null): LegacyTarget | null {
  return LEGACY[step ?? ""] ?? LEGACY[tab ?? ""] ?? null
}
