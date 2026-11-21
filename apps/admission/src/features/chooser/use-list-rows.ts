"use client"

import { todayIso } from "@ihsp/i18n"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { preferencesQuery } from "../algorithm/api"
import { useBudget } from "../budget/hooks"
import type { BudgetRow } from "../budget/types"
import { useFitRows } from "../fit/use-fit-rows"
import type { UniFit } from "../fit/fit-model"
import { useTasks } from "../tasks/api"
import { useEntryLabel } from "./hooks"
import {
  budgetGap,
  chancePercent,
  familyBudgetUsd,
  missingFacts,
  netCost,
  provenance,
  rowLabel,
  totals,
  type Cost,
  type ListTotals,
  type Missing,
  type Provenance,
  type RowLabel,
} from "./list-model"
import { planDeadline } from "./plan"
import type { ListEntry } from "./types"

export type TaskCount = { done: number; total: number }

/** One line of the comparison table: the entry with everything the columns and the graph need, computed once. */
export type ListRow = {
  entry: ListEntry
  fit: UniFit
  budget: BudgetRow | undefined
  label: RowLabel
  cost: Cost | null
  /** Yearly cost minus the family budget, USD; positive is over budget. */
  gap: number | null
  /** Admission chance 0..100 when known. */
  chance: number | null
  tasks: TaskCount
  /** The next deadline of the chosen round, `null` when none is on file. */
  deadline: string | null
  /** Set while the catalog's figures of this university are unverified. */
  unverified: Provenance | null
  /** Facts the AI research could look up. */
  missing: Missing[]
}

export type ListRows = {
  rows: ListRow[]
  /** The yearly family budget in USD from the survey, `null` when open. */
  familyBudget: number | null
  totals: ListTotals
  isPending: boolean
  fitFailed: boolean
}

/**
 * The student's list joined with fit, cost, label, chance and task counts, best fit first. Each source is optional:
 * a missing one leaves its columns empty, it never hides the row.
 */
export function useListRows(): ListRows {
  const fit = useFitRows()
  const budget = useBudget()
  const labelOf = useEntryLabel()
  const tasks = useTasks()
  const preferences = useQuery(preferencesQuery())
  const familyBudget = familyBudgetUsd(preferences.data?.answers.budget)

  const budgetByEntry = new Map((budget.data?.rows ?? []).map((row) => [row.entry_id, row]))
  const counts = new Map<string, TaskCount>()
  for (const task of tasks.data?.items ?? []) {
    if (!task.list_entry_id) continue
    const count = counts.get(task.list_entry_id) ?? { done: 0, total: 0 }
    count.total += 1
    if (task.status === "done") count.done += 1
    counts.set(task.list_entry_id, count)
  }
  const [now] = useState(() => new Date())
  const today = todayIso(now)
  const rows = fit.rows.map(({ entry, fit: ring }): ListRow => {
    const row = budgetByEntry.get(entry.id)
    const cost = netCost(entry, row)
    const chance = chancePercent(entry, row)
    const deadline = planDeadline(entry, today)
    return {
      entry,
      fit: ring,
      budget: row,
      label: rowLabel(labelOf(entry), entry.institution.country),
      cost,
      gap: budgetGap(cost, familyBudget),
      chance,
      tasks: counts.get(entry.id) ?? { done: 0, total: 0 },
      deadline,
      unverified: provenance(entry),
      missing: missingFacts(cost, chance, deadline),
    }
  })
  return {
    rows,
    familyBudget,
    totals: totals(
      rows.map((row) => row.gap),
      rows.map((row) => row.cost),
    ),
    isPending: fit.isPending,
    fitFailed: fit.error != null,
  }
}
