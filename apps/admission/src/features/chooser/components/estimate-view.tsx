"use client"

import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import type { Estimate } from "../types"
import { useOptionLabel } from "./option-label"

/** The range may be shown only when the API says so and sends both ends. */
export function showsRange(estimate: Estimate): estimate is Estimate & { low: number; high: number } {
  return estimate.range_visible && estimate.low !== null && estimate.high !== null
}

function sourceText(source: unknown): string {
  if (typeof source === "string") return source
  if (source && typeof source === "object") {
    const record = source as Record<string, unknown>
    const name = record.name ?? record.title ?? record.source
    const year = record.year
    if (typeof name === "string") return typeof year === "number" ? `${name}, ${year}` : name
  }
  return ""
}

/** The estimate of one list entry: a bucket label, and a percent range only when the API allows it. */
export function EstimateView({ estimate }: { estimate: Estimate }) {
  const t = useT("chooser")
  const label = useOptionLabel("estimate")
  const range = showsRange(estimate)
  const sources = estimate.sources.map(sourceText).filter(Boolean)
  return (
    <div className="flex flex-col gap-1.5" data-testid="estimate">
      <div className="flex flex-wrap items-center gap-2">
        {estimate.label ? <Badge variant="info">{label(estimate.label)}</Badge> : null}
        {range ? (
          <span className="text-sm font-medium">
            {t("estimate.range", { low: Math.round(estimate.low), high: Math.round(estimate.high) })}
          </span>
        ) : null}
        {estimate.label_overridden ? <Badge variant="neutral">{t("estimate.overridden")}</Badge> : null}
      </div>
      {range ? (
        <>
          <p className="text-muted-foreground text-xs">{t("estimate.notPrediction")}</p>
          {sources.length > 0 ? (
            <p className="text-muted-foreground text-xs">{t("estimate.sources", { sources: sources.join("; ") })}</p>
          ) : null}
          {estimate.method_version ? (
            <details className="text-muted-foreground text-xs">
              <summary className="cursor-pointer">{t("estimate.how")}</summary>
              <p className="pt-1">{t("estimate.method", { version: estimate.method_version })}</p>
            </details>
          ) : null}
        </>
      ) : (
        <p className="text-muted-foreground text-xs">{t("estimate.hidden")}</p>
      )}
    </div>
  )
}
