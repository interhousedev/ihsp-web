"use client"

import { getAdminStudentSyncsQuery, type MeSyncStatus, type StudentSyncStatus } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { StatusBadge } from "../../shared/components/status-badge"

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
