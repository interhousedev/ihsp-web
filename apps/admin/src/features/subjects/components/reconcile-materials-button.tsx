"use client"

import { getAdminReconcileStatus, postAdminReconcileSubjectMaterials, type ReconcileJobState } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { TOUCH } from "../../shared/utils/touch"

const FINISHED: ReconcileJobState[] = ["done", "failed", "cancelled"]

/** "Check that all lesson materials are in the notebook": starts a background job and polls its totals. */
export function ReconcileMaterialsButton({ subjectId }: { subjectId: string }) {
  const t = useT("subjects.reconcile")
  const [jobId, setJobId] = useState<string | null>(null)
  const start = useMutation({
    mutationFn: () => postAdminReconcileSubjectMaterials(subjectId),
    onSuccess: (data) => setJobId(data.job_id),
  })
  const job = useQuery({
    queryKey: ["admin", "reconcile", subjectId, jobId],
    queryFn: () => getAdminReconcileStatus(subjectId, jobId ?? ""),
    enabled: jobId !== null,
    refetchInterval: (query) => (query.state.data && !FINISHED.includes(query.state.data.status) ? 2000 : false),
  })
  const finished = job.data !== undefined && FINISHED.includes(job.data.status)
  const running = start.isPending || (jobId !== null && !finished)
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-xs">{t("hint")}</p>
      <Button type="button" variant="outline" className={TOUCH} disabled={running} onClick={() => start.mutate()}>
        {running ? t("running") : t("button")}
      </Button>
      {job.data?.status === "done" ? (
        <p role="status" className="text-xs">
          {t("done", {
            notebooks: job.data.notebooks,
            added: job.data.added,
            present: job.data.already_present,
            skipped: job.data.skipped,
          })}
        </p>
      ) : null}
      {start.isError || job.isError || job.data?.status === "failed" || job.data?.status === "cancelled" ? (
        <p role="alert" className="text-destructive text-xs">
          {t("error")}
        </p>
      ) : null}
    </div>
  )
}
