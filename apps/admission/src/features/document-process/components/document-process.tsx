"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton, StateView, StatusBadge, type StatusTone } from "@ihsp/ui"
import { QueryError } from "../../shell/components/query-error"
import { useDocumentProcess, type ProcessStep } from "../api"

const TONE: Record<string, StatusTone> = {
  not_started: "neutral",
  requested: "info",
  ready: "success",
  not_tracked: "neutral",
}

/** The lead time as a range, or one number when both ends agree. */
export function leadDays(step: Pick<ProcessStep, "lead_days_min" | "lead_days_max">) {
  return step.lead_days_min === step.lead_days_max
    ? String(step.lead_days_min)
    : `${step.lead_days_min}–${step.lead_days_max}`
}

function Step({ step, index }: { step: ProcessStep; index: number }) {
  const t = useT("docProcess")
  return (
    <li className="bg-card flex gap-3 rounded-card border p-3">
      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
        {index + 1}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">{step.title}</h3>
          <StatusBadge tone={TONE[step.status] ?? "neutral"} label={t(`status.${step.status}`)} />
        </div>
        <p className="text-sm">{step.description}</p>
        <p className="text-muted-foreground text-sm">
          {t("who")}: {step.issuer} · {t("time", { days: leadDays(step) })}
        </p>
      </div>
    </li>
  )
}

/** How transcripts and documents are issued, step by step; always open, with the student's own status per step. */
export function DocumentProcess() {
  const t = useT("docProcess")
  const query = useDocumentProcess()
  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (query.data.steps.length === 0) body = <StateView state="empty" title={t("empty")} />
  else
    body = (
      <ol className="flex flex-col gap-2">
        {query.data.steps.map((step, index) => (
          <Step key={step.key} step={step} index={index} />
        ))}
      </ol>
    )
  return (
    <section
      id="document-process"
      aria-labelledby="document-process-title"
      className="flex scroll-mt-20 flex-col gap-3"
    >
      <h2 id="document-process-title" className="text-lg font-semibold">
        {t("title")}
      </h2>
      {body}
    </section>
  )
}
