"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import { useState } from "react"
import type { MatchTable } from "../flow/steps-api"
import { DueText } from "./ledger-row"
import { filledCount, splitTables } from "./slot-model"
import { UniLogo } from "./uni-logo"

function UniRow({ table, active, onSelect }: { table: MatchTable; active: boolean; onSelect: () => void }) {
  const total = table.slots.length
  const done = filledCount(table)
  return (
    <li>
      <button
        type="button"
        data-testid={`uni-row-${table.institution_id}`}
        aria-current={active ? "true" : undefined}
        onClick={onSelect}
        className={cn(
          "hover:bg-accent/60 focus-visible:ring-ring flex min-h-14 w-full min-w-0 items-center gap-3 rounded-md px-3 py-2 text-left focus-visible:ring-2 focus-visible:outline-none",
          active && "md:bg-accent",
        )}
      >
        <UniLogo id={table.institution_id} name={table.institution_name} size="md" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{table.institution_name}</span>
          <span className="text-muted-foreground text-xs">{table.due_utc ? <DueText due={{ date: table.due_utc, predicted: table.due_predicted }} /> : null}</span>
        </span>
        {total > 0 ? (
          <span className={cn("shrink-0 text-xs font-semibold tabular-nums", done === total ? "text-success" : "text-muted-foreground")}>
            {done}/{total}
          </span>
        ) : null}
        <Icons.chevronRight aria-hidden className="text-muted-foreground size-4 shrink-0 md:hidden" />
      </button>
    </li>
  )
}

/** The master list: universities with a round logo, filled/total and the deadline; those with nothing to write sit folded below. */
export function UniList({ tables, selectedId, onSelect }: { tables: MatchTable[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const t = useT("essayLedger")
  const [showEmpty, setShowEmpty] = useState(false)
  const { active, empty } = splitTables(tables)
  return (
    <div className="flex flex-col p-1.5" data-testid="uni-list">
      <ul className="flex flex-col">
        {active.map((table) => (
          <UniRow key={table.institution_id} table={table} active={selectedId === table.institution_id} onSelect={() => onSelect(table.institution_id)} />
        ))}
      </ul>
      {empty.length > 0 ? (
        <div className="flex flex-col">
          <button
            type="button"
            aria-expanded={showEmpty}
            onClick={() => setShowEmpty((v) => !v)}
            className="text-muted-foreground hover:bg-accent/40 flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold tracking-wide uppercase"
          >
            <Icons.chevronDown aria-hidden className={cn("size-4 transition-transform", !showEmpty && "-rotate-90")} />
            {t("noEssaysGroup", { count: empty.length })}
          </button>
          {showEmpty ? (
            <ul className="flex flex-col">
              {empty.map((table) => (
                <UniRow key={table.institution_id} table={table} active={selectedId === table.institution_id} onSelect={() => onSelect(table.institution_id)} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
