"use client"

import { type AdminJob, getAdminJobsQuery, keys, postAdminJobCancel } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { StatusBadge } from "../../shared/components/status-badge"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

const REFRESH_MS = 5_000
const STOPPABLE = new Set<AdminJob["status"]>(["queued", "running"])

function progressText(job: AdminJob): string {
  const parts = job.total !== null ? [`${job.done} / ${job.total}`] : job.done ? [String(job.done)] : []
  for (const [name, value] of Object.entries(job.counters)) parts.push(`${name}: ${value}`)
  if (job.note) parts.push(job.note)
  return parts.join(" · ") || "—"
}

/** Worker processes (EMIS pulls, material re-syncs): running and queued ones, refreshed every 5 s, with a Stop. */
export function ProcessesTab() {
  const t = useT("monitoring.processes")
  const f = useFormatters()
  const query = useQuery({ ...getAdminJobsQuery(), refetchInterval: REFRESH_MS })
  const stop = useAdminMutation<string>({
    mutationFn: (id) => postAdminJobCancel(id),
    invalidate: [keys.admin.jobs()],
    success: t("stopped"),
  })
  const jobs = query.data?.items ?? []

  if (query.isPending) return <p className="text-muted-foreground text-sm">{t("loading")}</p>
  if (jobs.length === 0) return <p className="text-muted-foreground text-sm">{t("empty")}</p>

  return (
    <ul className="flex flex-col gap-2" aria-label={t("title")}>
      {jobs.map((job) => (
        <li key={job.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-medium break-words">{job.label}</span>
            <span className="text-muted-foreground text-xs">
              {t("started", { at: f.dateTime(job.started_at ?? job.created_at) })} · {progressText(job)}
            </span>
          </div>
          <StatusBadge status={job.status} />
          {STOPPABLE.has(job.status) ? (
            <Button
              variant="destructive"
              size="sm"
              className={TOUCH}
              disabled={stop.isPending}
              aria-label={t("stopLabel", { label: job.label })}
              onClick={() => stop.mutate(job.id)}
            >
              {t("stop")}
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
