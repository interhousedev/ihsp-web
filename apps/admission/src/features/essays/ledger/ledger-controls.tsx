"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { Button, cn, Icons, Input, ToggleGroup, ToggleGroupItem } from "@ihsp/ui"
import type { PromptScope } from "../flow/api"
import type { LedgerSummary } from "./ledger-model"
import type { Lens } from "./ledger-state"

/** "9 essays needed · 2 started · next deadline 1 Jan": the one sentence that says what is owed. */
export function LedgerSentence({ summary }: { summary: LedgerSummary }) {
  const t = useT("essayLedger")
  return (
    <p data-testid="ledger-summary" className="text-muted-foreground text-sm md:text-base">
      <span className="text-foreground font-semibold">{t("summaryNeed", { needed: summary.needed })}</span>
      {" · "}
      {t("summaryStarted", { count: summary.started })}
      {summary.due ? (
        <>
          {" · "}
          {t(summary.due.predicted ? "nextDuePredicted" : "nextDue", {
            date: formatDate(summary.due.date, undefined, { day: "numeric", month: "short" }),
          })}
        </>
      ) : null}
    </p>
  )
}

/** Search, by essay / by university, and (by essay only) my list / all prompts; on a phone the scope is one filter button. */
export function LedgerToolbar({
  scope,
  lens,
  query,
  onQuery,
  onScope,
  onLens,
}: {
  scope: PromptScope
  lens: Lens
  query: string
  onQuery: (query: string) => void
  onScope: (scope: PromptScope) => void
  onLens: (lens: Lens) => void
}) {
  const t = useT("essayLedger")
  const all = scope === "all"
  return (
    <div className="flex flex-wrap items-center gap-2">
      {lens === "essay" ? (
        <div className="relative min-w-0 flex-1 basis-48 md:max-w-sm">
          <Icons.search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="h-11 pl-9 md:h-9"
          />
        </div>
      ) : null}
      <ToggleGroup
        value={[lens]}
        onValueChange={(value) => value[0] && onLens(value[0] as Lens)}
        aria-label={t("lensLabel")}
        variant="outline"
      >
        <ToggleGroupItem value="essay" className="min-h-11 px-3 md:min-h-9">
          {t("lensEssay")}
        </ToggleGroupItem>
        <ToggleGroupItem value="uni" className="min-h-11 px-3 md:min-h-9">
          {t("lensUni")}
        </ToggleGroupItem>
      </ToggleGroup>
      {lens === "essay" ? (
        <>
          <ToggleGroup
            value={[scope]}
            onValueChange={(value) => value[0] && onScope(value[0] as PromptScope)}
            aria-label={t("scopeLabel")}
            variant="outline"
            className="hidden md:flex"
          >
            <ToggleGroupItem value="list" className="min-h-9 px-3">
              {t("scopeList")}
            </ToggleGroupItem>
            <ToggleGroupItem value="all" className="min-h-9 px-3">
              {t("scopeAllPlain")}
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("size-11 md:hidden", all && "bg-accent")}
            aria-pressed={all}
            aria-label={t(all ? "scopeShowList" : "scopeShowAll")}
            title={t(all ? "scopeShowList" : "scopeShowAll")}
            onClick={() => onScope(all ? "list" : "all")}
          >
            <Icons.adjustments aria-hidden />
          </Button>
        </>
      ) : null}
    </div>
  )
}
