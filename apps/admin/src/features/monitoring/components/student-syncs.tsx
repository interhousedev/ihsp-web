"use client"

import {
  getAdminStudentSyncsQuery,
  keys,
  type MeSyncStatus,
  postAdminStudentSyncStop,
  type StudentSyncStatus,
} from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { ConfirmDialog } from "@ihsp/ui"
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left">
              <tr>
                <th className="py-1 pr-3 font-medium">{t("studentSyncsColumns.student")}</th>
                <th className="py-1 pr-3 font-medium">{t("studentSyncsColumns.status")}</th>
                <th className="py-1 pr-3 font-medium">{t("studentSyncsColumns.attempts")}</th>
                <th className="py-1 pr-3 font-medium">{t("studentSyncsColumns.lastError")}</th>
                <th className="py-1 pr-3 font-medium">{t("studentSyncsColumns.finished")}</th>
                <th className="py-1 pr-3 font-medium">
                  <span className="sr-only">{t("studentStop")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.user_id} className="border-t">
                  <td className="py-1 pr-3 font-mono text-xs">{row.user_id}</td>
                  <td className="py-1 pr-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-1 pr-3 tabular-nums">
                    {t("studentSyncsAttempts", { n: row.attempts, max: row.max_attempts ?? row.attempts })}
                  </td>
                  <td className="py-1 pr-3 break-all text-xs">{row.last_error ?? "—"}</td>
                  <td className="py-1 pr-3">{row.finished_at ? f.dateTime(row.finished_at) : "—"}</td>
                  <td className="py-1 pr-3">
                    {row.status === "running" ? (
                      <button
                        type="button"
                        className={`${TOUCH} text-destructive text-xs underline underline-offset-2`}
                        onClick={() => setStopping(row)}
                      >
                        {t("studentStop")}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
