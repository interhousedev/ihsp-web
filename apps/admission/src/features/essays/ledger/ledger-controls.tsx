"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { ToggleGroup, ToggleGroupItem } from "@ihsp/ui"
import type { PromptScope } from "../flow/api"
import type { LedgerSummary } from "./ledger-model"
import type { Lens } from "./ledger-state"

/** "6 essays for 14 prompts · 2 started · due 1 Jan": the one sentence that says what is owed. */
export function LedgerSentence({ summary }: { summary: LedgerSummary }) {
  const t = useT("essayLedger")
  return (
    <p data-testid="ledger-summary" className="text-muted-foreground text-sm md:text-base">
      <span className="text-foreground font-semibold">{t("summaryNeed", { needed: summary.needed, prompts: summary.prompts })}</span>
      {" · "}
      {t("summaryStarted", { count: summary.started })}
      {summary.due ? (
        <>
          {" · "}
          {t(summary.due.predicted ? "duePredicted" : "due", { date: formatDate(summary.due.date) })}
        </>
      ) : null}
    </p>
  )
}

/** My list / all, and by essay / by university. */
export function LedgerToggles({
  scope,
  lens,
  allCount,
  onScope,
  onLens,
}: {
  scope: PromptScope
  lens: Lens
  allCount: number | null
  onScope: (scope: PromptScope) => void
  onLens: (lens: Lens) => void
}) {
  const t = useT("essayLedger")
  return (
    <div className="flex flex-wrap items-center gap-2">
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
        <ToggleGroup
          value={[scope]}
          onValueChange={(value) => value[0] && onScope(value[0] as PromptScope)}
          aria-label={t("scopeLabel")}
          variant="outline"
        >
          <ToggleGroupItem value="list" className="min-h-11 px-3 md:min-h-9">
            {t("scopeList")}
          </ToggleGroupItem>
          <ToggleGroupItem value="all" className="min-h-11 px-3 md:min-h-9">
            {allCount === null ? t("scopeAllPlain") : t("scopeAll", { count: allCount })}
          </ToggleGroupItem>
        </ToggleGroup>
      ) : null}
    </div>
  )
}
