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
  prompts: number
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

export function summarize(rows: LedgerRow[]): LedgerSummary {
  return {
    needed: rows.length,
    prompts: rows.reduce((n, r) => n + r.prompts.length, 0),
    started: rows.filter((r) => r.essays.length > 0).length,
    due: rows.reduce<LedgerRow["due"]>((acc, r) => earlier(acc, r.due), null),
  }
}

/** The legacy `?step=` / `?tab=` addresses of the six-step flow and where each one lands now. */
export type LegacyTarget = { lens: "essay" | "uni"; drawer: "practice" | "ideas" | "examples" | null }

const LEGACY: Record<string, LegacyTarget> = {
  map: { lens: "essay", drawer: null },
  colleges: { lens: "essay", drawer: null },
  practice: { lens: "essay", drawer: "practice" },
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
