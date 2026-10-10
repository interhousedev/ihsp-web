"use client"

import type { NotebookUsage, UsagePart } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Progress, ProgressLabel, Skeleton, StateView, cn } from "@ihsp/ui"
import { useNotebookUsage } from "../api/use-notebook-usage"
import { useOptionalWorkspace } from "../workspace-context"
import { ResponsiveDialog } from "./responsive-dialog"

export type UsageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Used share of a budget, 0 to 100. */
function percentOf(part: UsagePart): number {
  return part.limit > 0 ? Math.min(100, Math.max(0, Math.round((part.used / part.limit) * 100))) : 0
}

function Meter({ label, part }: { label: string; part: UsagePart }) {
  const t = useT("notebooks")
  const format = useFormatters()
  const percent = percentOf(part)
  return (
    <div className="flex flex-col gap-1.5">
      <Progress
        value={percent}
        className={cn(
          "gap-1.5",
          // Amber from 80 %, red when used up.
          percent >= 80 && "[&_[data-slot=progress-indicator]]:bg-amber-500",
          percent >= 100 && "[&_[data-slot=progress-indicator]]:bg-destructive",
        )}
      >
        <ProgressLabel>{label}</ProgressLabel>
        <span className="text-muted-foreground ms-auto text-sm tabular-nums">{t("usage.used", { percent })}</span>
      </Progress>
      {part.resets_at ? (
        <p className="text-muted-foreground text-xs">{t("usage.resets", { time: format.time(part.resets_at) })}</p>
      ) : null}
    </div>
  )
}

function UsageBody({ usage }: { usage: NotebookUsage }) {
  const t = useT("notebooks")
  const { artifacts, slides, infographic } = usage.quotas
  const counters = [
    {
      id: "artifacts",
      text: t("usage.materials", {
        used: artifacts.used,
        limit: artifacts.limit,
      }),
    },
    {
      id: "slides",
      text: t("usage.quota", {
        kind: t("kind.slides"),
        used: slides.used,
        limit: slides.limit,
      }),
    },
    {
      id: "infographic",
      text: t("usage.quota", {
        kind: t("kind.infographic"),
        used: infographic.used,
        limit: infographic.limit,
      }),
    },
  ]

  return (
    <>
      <Meter label={t("usage.session")} part={usage.budget.session} />
      <Meter label={t("usage.day")} part={usage.budget.day} />
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("usage.kinds")}</h3>
        <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
          {counters.map((counter) => (
            <li key={counter.id}>{counter.text}</li>
          ))}
        </ul>
        <p className="text-sm">
          {t("usage.generating", {
            count: usage.generating,
            limit: usage.generating_limit,
          })}
        </p>
      </div>
      <p className="text-muted-foreground text-xs">{t("usage.note")}</p>
    </>
  )
}

/** "Usage": the session and day meters with their reset times, the daily counters per kind, and how limits work. */
export function UsageDialog({ open, onOpenChange }: UsageDialogProps) {
  const t = useT("notebooks")
  const usage = useNotebookUsage(useOptionalWorkspace()?.notebookId)

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("usage.title")}
      description={t("usage.description")}
    >
      {usage.isPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : usage.isError ? (
        <StateView state="error" error={usage.error} onRetry={() => void usage.refetch()} />
      ) : (
        <UsageBody usage={usage.data} />
      )}
    </ResponsiveDialog>
  )
}
