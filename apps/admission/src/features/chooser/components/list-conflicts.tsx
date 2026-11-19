"use client"

import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Icons, Pill } from "@ihsp/ui"
import type { ListEntry } from "../types"

type Conflict = ListEntry["conflicts"][number]
type Severity = Conflict["severity"]

export const CONFLICT_CODES = [
  "multiple_ed",
  "ed_with_restrictive",
  "multiple_restrictive",
  "restrictive_with_early",
  "multiple_ed2",
] as const

/** A conflict is identified by its code and the entries it involves, in any order. */
export function conflictKey(conflict: Conflict): string {
  return `${conflict.code}:${[...conflict.entry_ids].sort().join(",")}`
}

/** The distinct conflicts of the list; a conflict seen on several entries is listed once. */
export function distinctConflicts(entries: ListEntry[]): Conflict[] {
  const byKey = new Map<string, Conflict>()
  for (const entry of entries) for (const conflict of entry.conflicts ?? []) byKey.set(conflictKey(conflict), conflict)
  return [...byKey.values()]
}

/** Conflicts in `next` that were not in `known`. */
export function newConflicts(known: Conflict[], next: Conflict[]): Conflict[] {
  const seen = new Set(known.map(conflictKey))
  return next.filter((conflict) => !seen.has(conflictKey(conflict)))
}

const TONE: Record<Severity, "danger" | "warning"> = { conflict: "danger", check: "warning" }

/** The one-line explanation of a conflict, naming the universities involved. */
export function useConflictText() {
  const t = useT("chooser")
  return (conflict: Conflict, entries: ListEntry[]): string => {
    const names = conflict.entry_ids
      .map((id) => entries.find((entry) => entry.id === id)?.institution.name)
      .filter((name): name is string => Boolean(name))
      .join(", ")
    return t(`list.conflicts.explain.${conflict.code as (typeof CONFLICT_CODES)[number]}`, { names })
  }
}

/** Banner above the list: one line per distinct conflict; severity `conflict` is destructive, `check` a warning. */
export function ConflictBanner({ entries }: { entries: ListEntry[] }) {
  const t = useT("chooser")
  const text = useConflictText()
  const conflicts = distinctConflicts(entries)
  if (conflicts.length === 0) return null
  const hard = conflicts.some((conflict) => conflict.severity === "conflict")
  return (
    <Alert
      variant={hard ? "destructive" : "default"}
      className={hard ? undefined : "text-warning"}
      data-severity={hard ? "conflict" : "check"}
    >
      <Icons.warning aria-hidden />
      <AlertDescription className="flex flex-col gap-1">
        <span className="font-medium">{t("list.conflicts.title")}</span>
        <ul className="flex flex-col gap-1">
          {conflicts.map((conflict) => (
            <li
              key={conflictKey(conflict)}
              data-severity={conflict.severity}
              className={conflict.severity === "conflict" ? "text-destructive" : "text-warning"}
            >
              {text(conflict, entries)}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

/** Inline badges on an entry, one per conflict it takes part in. */
export function ConflictBadges({ entry }: { entry: ListEntry }) {
  const t = useT("chooser")
  const conflicts = (entry.conflicts ?? []).filter((conflict) => conflict.entry_ids.includes(entry.id))
  if (conflicts.length === 0) return null
  return (
    <span className="flex flex-wrap gap-1.5">
      {conflicts.map((conflict) => (
        <Pill key={conflictKey(conflict)} tone={TONE[conflict.severity]} className="h-6 px-2 text-xs">
          <Icons.warning aria-hidden className="size-3" />
          {t(`list.conflicts.badge.${conflict.code as (typeof CONFLICT_CODES)[number]}`)}
        </Pill>
      ))}
    </span>
  )
}
