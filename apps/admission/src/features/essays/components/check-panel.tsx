"use client"

import { ApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { AiTabCard } from "@/components/ai-tab-card"
import { useCheckEssay } from "../api"
import { CheckResult } from "./check-result"
import { CoachError } from "./coach-error"

/** Scores the saved draft against its prompt; the draft is saved first, and the result is not stored. */
export function CheckPanel({ essayId, beforeRun }: { essayId: string; beforeRun: () => Promise<unknown> }) {
  const t = useT("essayCheck")
  const check = useCheckEssay(essayId)
  const run = () =>
    void beforeRun().then(
      () => check.mutate(),
      () => undefined,
    )
  const err = check.error instanceof ApiError ? check.error : null
  const tooShort = err?.type === "admission/essay_too_short"
  return (
    <AiTabCard label={t("tab")} icon={<Icons.sparkles aria-hidden />} className="gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">{t("hint")}</p>
        <Button type="button" size="sm" disabled={check.isPending} onClick={run}>
          <Icons.sparkles aria-hidden />
          {check.isPending ? t("running") : t("run")}
        </Button>
      </div>
      {tooShort ? (
        <p role="alert" className="text-destructive text-sm">
          {t("tooShort", { min: Number(err.params.min ?? 50), count: Number(err.params.count ?? 0) })}
        </p>
      ) : (
        <CoachError error={check.error} />
      )}
      {check.data ? <CheckResult data={check.data} /> : null}
    </AiTabCard>
  )
}
