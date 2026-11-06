"use client"

import {
  getAdminStudentSyncsQuery,
  keys,
  type MeSyncStatus,
  postAdminStudentSyncStop,
  type StudentSyncStatus,
} from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { ConfirmDialog, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { StatusBadge } from "../../shared/components/status-badge"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

const STATUSES: readonly StudentSyncStatus[] = ["failed", "pending", "running", "succeeded"]

/** Students whose initial EMIS sync (timetable, subgroup, marks) has not finished, failed first. */
export function StudentSyncs() {
  const t = useT("monitoring.sync")
  const f = useFormatters()
  const failed = useQuery(getAdminStudentSyncsQuery("failed"))
  const pending = useQuery(getAdminStudentSyncsQuery("pending"))
  const running = useQuery(getAdminStudentSyncsQuery("running"))
  const rows: MeSyncStatus[] = STATUSES.flatMap((status) => {
    const query = status === "failed" ? failed : status === "pending" ? pending : status === "running" ? running : null
    return query?.data ?? []
  })
  const loading = failed.isPending || pending.isPending || running.isPending
  const [stopping, setStopping] = useState<MeSyncStatus | null>(null)
  const stop = useAdminMutation({
    mutationFn: (userId: string) => postAdminStudentSyncStop(userId),
    invalidate: STATUSES.map((status) => keys.admin.studentSyncs(status)),
    success: t("studentStopped"),
    onSuccess: () => setStopping(null),
  })

  return (
    <section className="flex flex-col gap-3" aria-labelledby="student-syncs-title">
      <h2 id="student-syncs-title" className="text-base font-semibold">
        {t("studentSyncsTitle")}
      </h2>
      {loading ? <p className="text-muted-foreground text-sm">{t("loading")}</p> : null}
      {!loading && rows.length === 0 ? <p className="text-muted-foreground text-sm">{t("studentSyncsEmpty")}</p> : null}
      {rows.length > 0 ? (
        <div className="min-w-0">
          <Table>
            <TableHeader className="text-muted-foreground">
              <TableRow>
                <TableHead>{t("studentSyncsColumns.student")}</TableHead>
                <TableHead>{t("studentSyncsColumns.status")}</TableHead>
                <TableHead>{t("studentSyncsColumns.attempts")}</TableHead>
                <TableHead>{t("studentSyncsColumns.lastError")}</TableHead>
                <TableHead>{t("studentSyncsColumns.finished")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("studentStop")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.user_id}>
                  <TableCell className="font-mono text-xs">{row.user_id}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {t("studentSyncsAttempts", { n: row.attempts, max: row.max_attempts ?? row.attempts })}
                  </TableCell>
                  <TableCell className="break-all text-xs">{row.last_error ?? "—"}</TableCell>
                  <TableCell>{row.finished_at ? f.dateTime(row.finished_at) : "—"}</TableCell>
                  <TableCell>
                    {row.status === "running" ? (
                      <button
                        type="button"
                        className={`${TOUCH} text-destructive text-xs underline underline-offset-2`}
                        onClick={() => setStopping(row)}
                      >
                        {t("studentStop")}
                      </button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      <ConfirmDialog
        open={stopping !== null}
        onOpenChange={(open) => {
          if (!open) setStopping(null)
        }}
        title={t("studentStopTitle")}
        description={t("studentStopDescription")}
        confirmLabel={t("studentStopConfirm")}
        loading={stop.isPending}
        onConfirm={() => {
          if (stopping) stop.mutate(stopping.user_id)
        }}
      />
    </section>
  )
}
