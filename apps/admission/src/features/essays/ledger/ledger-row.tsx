"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { Button, cn, Icons } from "@ihsp/ui"
import { rowAskedBy, rowUniversities, type LedgerRow as Row } from "./ledger-model"
import { UniLogoStack } from "./uni-logo"
import { MAX_TARGETS, useStartEssay } from "./use-start-essay"

/** A uniqueness score as a small number in a ring: the one score the ledger shows. */
export function ScoreDot({ value, className }: { value: number; className?: string }) {
  const t = useT("essayLedger")
  const tone =
    value >= 70
      ? "text-success border-success/50"
      : value >= 40
        ? "text-foreground border-hairline-strong"
        : "text-warning border-warning/50"
  return (
    <span
      title={t("score", { value })}
      aria-label={t("score", { value })}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums",
        tone,
        className,
      )}
    >
      {value}
    </span>
  )
}

/** A deadline as a short date ("1 Jan"), with "≈" when the server only predicts it. */
export function DueText({ due }: { due: NonNullable<Row["due"]> }) {
  const t = useT("essayLedger")
  return (
    <span className="shrink-0 tabular-nums">
      {t(due.predicted ? "dueShortPredicted" : "dueShort", {
        date: formatDate(due.date, undefined, { day: "numeric", month: "short" }),
      })}
    </span>
  )
}

/** One prompt group as a line of the ledger: status, theme, universities, deadline, the essay written or the way to start. */
export function LedgerRowButton({ row, onOpen }: { row: Row; onOpen: () => void }) {
  const { start, pending } = useStartEssay()
  const t = useT("essayLedger")
  const te = useT("essays")
  const started = row.essays.length > 0
  const first = row.essays[0]
  const unis = rowUniversities(row)
  const asked = rowAskedBy(row)
  const many = row.group.prompts.length > 1
  return (
    <li className="flex min-w-0 items-center gap-1">
      <button
        type="button"
        data-testid={`ledger-row-${row.group.key}`}
        aria-haspopup="dialog"
        onClick={onOpen}
        className="hover:bg-accent/50 focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none md:px-3"
      >
        <span
          aria-hidden
          className={cn(
            "size-3 shrink-0 rounded-full border-2",
            started ? "bg-primary border-primary" : "border-hairline-strong",
          )}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-sm font-medium">{row.label}</span>
            {unis.length > 0 ? (
              <UniLogoStack unis={unis} />
            ) : (
              <span className="text-muted-foreground shrink-0 text-xs">{t("commonApp")}</span>
            )}
            {row.due ? (
              <span className="text-muted-foreground ml-auto hidden text-xs sm:inline">
                <DueText due={row.due} />
              </span>
            ) : null}
          </span>
          <span className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
            {first ? (
              <span className="min-w-0 truncate">
                <span className="text-foreground font-medium">{first.title || te("untitled")}</span>
                {" · "}
                {first.word_limit
                  ? te("wordsOf", { count: first.word_count, limit: first.word_limit })
                  : te("words", { count: first.word_count })}
                {row.essays.length > 1 ? ` · +${row.essays.length - 1}` : ""}
              </span>
            ) : (
              <span className="truncate">{row.group.prompts[0]?.prompt}</span>
            )}
            {started ? (
              <span className="text-success shrink-0">{t("draftStarted", { count: row.essays.length })}</span>
            ) : null}
            {row.due ? (
              <span className="sm:hidden">
                <DueText due={row.due} />
              </span>
            ) : null}
          </span>
          {asked.exact.length > 0 ? (
            <span data-testid={`ledger-asked-${row.group.key}`} className="text-muted-foreground truncate text-xs">
              {t("askedBy", { names: asked.exact.join(", ") })}
              {asked.similar.length > 0 ? ` · ${t("similarTo", { names: asked.similar.join(", ") })}` : ""}
            </span>
          ) : null}
        </span>
        {row.best !== null ? <ScoreDot value={row.best} className="size-8 text-xs" /> : null}
        <span
          className={cn(
            "hidden shrink-0 text-sm font-medium sm:inline",
            started ? "text-muted-foreground" : "text-primary",
          )}
        >
          {t(started ? "open" : "start")}
        </span>
        <Icons.chevronRight aria-hidden className="text-muted-foreground size-4 shrink-0" />
      </button>
      {many && !started ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          data-testid={`ledger-write-all-${row.group.key}`}
          onClick={() => start(row.group, row.label)}
          className="shrink-0"
        >
          <Icons.add aria-hidden />
          <span className="hidden sm:inline">
            {t("writeAll", { count: Math.min(row.group.prompts.length, MAX_TARGETS) })}
          </span>
          <span className="sm:hidden">{Math.min(row.group.prompts.length, MAX_TARGETS)}</span>
        </Button>
      ) : null}
    </li>
  )
}
