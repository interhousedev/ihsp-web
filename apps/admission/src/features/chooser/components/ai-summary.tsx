"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Reveal, Skeleton } from "@ihsp/ui"
import { useSummary } from "../hooks"

/** A short summary of the recorded facts, written by the model on request; it is not stored. */
export function AiSummary({ institutionId }: { institutionId: string }) {
  const t = useT("chooser")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const summary = useSummary(institutionId, locale)
  return (
    <section aria-labelledby="ai-summary-title" className="bg-muted/40 rounded-card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="ai-summary-title" className="flex items-center gap-2 text-sm font-semibold">
          <Icons.sparkles className="size-4" aria-hidden />
          {t("summary.title")}
        </h3>
        <Button type="button" variant="outline" size="sm" disabled={summary.isPending} onClick={() => summary.mutate()}>
          {summary.data ? t("summary.refresh") : t("summary.generate")}
        </Button>
      </div>
      {summary.isPending ? (
        <div role="status" aria-busy="true" aria-label={t("summary.loading")} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : null}
      {summary.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(summary.error)}
        </p>
      ) : null}
      {summary.data ? (
        <Reveal className="flex flex-col gap-2">
          <p className="text-sm">{summary.data.summary}</p>
          {summary.data.missing.length > 0 ? (
            <p className="text-muted-foreground text-xs">
              {t("summary.missing", { items: summary.data.missing.join(", ") })}
            </p>
          ) : null}
          <p className="text-muted-foreground text-xs">{t("summary.factsOnly")}</p>
        </Reveal>
      ) : (
        <p className="text-muted-foreground text-xs">{summary.isPending ? "" : t("summary.hint")}</p>
      )}
    </section>
  )
}
