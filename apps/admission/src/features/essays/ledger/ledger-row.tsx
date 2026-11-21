"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import { groupLabel } from "../flow/group-label"
import type { LedgerRow as Row } from "./ledger-model"

/** A uniqueness score as a small number in a ring: the one score the ledger shows. */
export function ScoreDot({ value, className }: { value: number; className?: string }) {
  const t = useT("essayLedger")
  const tone = value >= 70 ? "text-success border-success/50" : value >= 40 ? "text-foreground border-hairline-strong" : "text-warning border-warning/50"
  return (
    <span
      title={t("score", { value })}
      aria-label={t("score", { value })}
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums", tone, className)}
    >
      {value}
    </span>
  )
}

/** One prompt group as a line of the ledger: what the essay is about, where it is needed, how far it is. */
export function LedgerRowButton({ row, onOpen }: { row: Row; onOpen: () => void }) {
  const t = useT("essayLedger")
  const te = useT("essays")
  const started = row.essays.length > 0
  const first = row.essays[0]
  const unis = new Set(row.prompts.map((p) => p.institution_name))
  return (
    <li>
      <button
        type="button"
        data-testid={`ledger-row-${row.group.key}`}
        aria-haspopup="dialog"
        onClick={onOpen}
        className="bg-card hover:bg-accent/50 focus-visible:ring-ring rounded-card flex w-full min-w-0 items-center gap-3 border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none md:p-4"
      >
        <span
          aria-hidden
          className={cn("size-3 shrink-0 rounded-full border-2", started ? "bg-primary border-primary" : "border-hairline-strong")}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="min-w-0 truncate font-semibold">{row.label}</span>
            <span className="text-muted-foreground shrink-0 text-xs">{t("promptsCount", { count: row.prompts.length })}</span>
          </span>
          <span className="text-muted-foreground truncate text-xs">{groupLabel({ ...row.group, prompts: row.prompts })}</span>
          <span className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
            {first ? (
              <span className="min-w-0 truncate">
                <span className="text-foreground font-medium">{first.title || te("untitled")}</span>
                {" · "}
                {first.word_limit ? te("wordsOf", { count: first.word_count, limit: first.word_limit }) : te("words", { count: first.word_count })}
                {row.essays.length > 1 ? ` · +${row.essays.length - 1}` : ""}
              </span>
            ) : (
              <span>{t("notStarted")}</span>
            )}
            {row.due ? (
              <span className="shrink-0">
                {t(row.due.predicted ? "duePredicted" : "due", { date: formatDate(row.due.date) })}
              </span>
            ) : null}
            {unis.size > 0 && row.group.in_list_count > 0 ? (
              <span className="shrink-0">{t("inListCount", { count: row.group.in_list_count })}</span>
            ) : null}
          </span>
        </span>
        {row.best !== null ? <ScoreDot value={row.best} /> : null}
        <span className="text-primary hidden shrink-0 text-sm font-medium sm:inline">{t(started ? "open" : "start")}</span>
        <Icons.chevronRight aria-hidden className="text-muted-foreground size-4 shrink-0" />
      </button>
    </li>
  )
}
