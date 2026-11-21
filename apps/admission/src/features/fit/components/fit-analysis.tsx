"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useEffect, useRef } from "react"
import type { UseMutationResult } from "@tanstack/react-query"
import type { FitAnalysis } from "../types"

/**
 * The short AI read of the fit under the ring: strengths, risks and the next step. It runs by the button, or by
 * itself once when `auto` (the university is researched), and the parent redraws the ring from the result.
 */
export function FitAnalysisPanel({
  analysis,
  auto,
}: {
  analysis: UseMutationResult<FitAnalysis, Error, void>
  auto: boolean
}) {
  const t = useT("fit")
  const started = useRef(false)
  const { mutate } = analysis
  useEffect(() => {
    if (auto && !started.current) {
      started.current = true
      mutate()
    }
  }, [auto, mutate])
  const data = analysis.data
  return (
    <section className="flex flex-col gap-2 border-t pt-3" aria-label={t("analysis.title")} data-testid="fit-analysis">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("analysis.title")}</h3>
        <Button type="button" size="sm" variant="outline" disabled={analysis.isPending} onClick={() => analysis.mutate()}>
          {analysis.isPending ? t("analysis.running") : data ? t("analysis.rerun") : t("analysis.run")}
        </Button>
      </div>
      {analysis.isError ? <p className="text-destructive text-xs">{t("analysis.failed")}</p> : null}
      {data && !data.ai ? <p className="text-muted-foreground text-xs">{t("analysis.noConsent")}</p> : null}
      {data?.ai ? (
        <div className="flex flex-col gap-2 text-sm">
          {data.strengths.length > 0 ? (
            <div>
              <p className="text-xs font-medium">{t("analysis.strengths")}</p>
              <ul className="list-disc ps-5">
                {data.strengths.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.risks.length > 0 ? (
            <div>
              <p className="text-xs font-medium">{t("analysis.risks")}</p>
              <ul className="list-disc ps-5">
                {data.risks.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.next_step ? (
            <p>
              <span className="text-xs font-medium">{t("analysis.next")} </span>
              {data.next_step}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
