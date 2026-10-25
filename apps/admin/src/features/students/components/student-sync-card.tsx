"use client"

import { getAdminStudentSyncQuery, keys, type MeSyncStatus, postAdminStudentSync } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Card, CardContent, ConfirmDialog } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"

const ACTIVE: readonly MeSyncStatus["status"][] = ["pending", "running"]
const POLL_MS = 3000

/**
 * The EMIS sync button of the Overview tab: queues a full re-sync of one student (subgroup,
 * timetable lessons, teachers, marks) after a confirm, shows the durable job and polls while it runs.
 */
export function StudentSyncCard({ userId }: { userId: string }) {
  const t = useT("students")
  const f = useFormatters()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const query = useQuery({
    ...getAdminStudentSyncQuery(userId),
    refetchInterval: (q) => (q.state.data && ACTIVE.includes(q.state.data.status) ? POLL_MS : false),
  })
  const job = query.data ?? null
  const running = job !== null && ACTIVE.includes(job.status)
  const status = job?.status
  const start = useAdminMutation({
    mutationFn: () => postAdminStudentSync(userId),
    invalidate: [keys.admin.studentSync(userId)],
    success: t("overview.syncQueued"),
    onSuccess: () => setConfirming(false),
  })

  // A finished sync may have changed the profile (subgroup, last sync): reload it.
  useEffect(() => {
    if (status === "succeeded" || status === "failed") {
      void queryClient.invalidateQueries({ queryKey: keys.admin.students.detail(userId) })
    }
  }, [status, userId, queryClient])

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">{t("overview.syncTitle")}</h3>
          <p className="text-muted-foreground text-xs">{t("overview.syncHint")}</p>
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={running || start.isPending}
            onClick={() => setConfirming(true)}
          >
            {t("overview.syncButton")}
          </Button>
        </div>
        {job ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2" aria-live="polite">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">{t("overview.syncTitle")}</dt>
              <dd>{t(`overview.syncStatus.${job.status}`)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">
                {t("overview.syncAttempts", { n: job.attempts, max: job.max_attempts ?? job.attempts })}
              </dt>
              <dd className="tabular-nums">{job.attempts}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">{t("overview.syncLastError")}</dt>
              <dd className="break-words text-xs">{job.last_error ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">{t("overview.syncFinished")}</dt>
              <dd>{job.finished_at ? f.dateTime(job.finished_at) : "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">{t("overview.syncNever")}</p>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open) setConfirming(false)
        }}
        title={t("overview.syncConfirmTitle")}
        description={t("overview.syncConfirmDescription")}
        confirmLabel={t("overview.syncConfirmAction")}
        loading={start.isPending}
        onConfirm={() => start.mutate(undefined)}
      />
    </Card>
  )
}
