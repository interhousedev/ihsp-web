"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { CURATOR_ROLES } from "../../../config/nav"
import { QueryError } from "../../shell/components/query-error"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { pick, useStaffTrajectories, useStaffTrajectoryMutations, type TrajectorySummary } from "../api"

export function StaffTrajectoriesBody() {
  const t = useT("trajectories")
  const lang = useLocale()
  const errorMessage = useErrorMessage()
  const query = useStaffTrajectories()
  const { remove } = useStaffTrajectoryMutations()
  const [deleting, setDeleting] = useState<TrajectorySummary | null>(null)
  const rows = query.data?.items ?? []

  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (rows.length === 0) body = <StateView state="empty" title={t("staff.emptyTitle")} />
  else
    body = (
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.id} className="bg-card flex flex-wrap items-center gap-3 rounded-card border p-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-medium">{pick(r.title, lang)}</span>
              <span className="text-muted-foreground text-xs">
                {t(`field.${r.field}`)} · {t("counts", { stages: r.stage_count, steps: r.node_count })} ·{" "}
                {r.published ? t("staff.published") : t("staff.draft")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="min-h-11"
                render={<Link href={`/staff/trajectories/edit/?id=${encodeURIComponent(r.id)}`} />}
              >
                {t("staff.edit")}
              </Button>
              <Button type="button" size="sm" variant="ghost" className="min-h-11" onClick={() => setDeleting(r)}>
                {t("staff.delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    )

  return (
    <div className={pageClass()}>
      <AppPageHeader
        icon="route"
        title={t("staff.title")}
        actions={
          <Button size="sm" className="min-h-11" render={<Link href="/staff/trajectories/edit/" />}>
            {t("staff.add")}
          </Button>
        }
      />
      {body}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("staff.deleteTitle")}
        description={t("staff.deleteText")}
        confirmLabel={t("staff.delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          remove.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
            onError: (e) => {
              setDeleting(null)
              toast.error(errorMessage(e))
            },
          })
        }}
      />
    </div>
  )
}

export function StaffTrajectoriesPage() {
  return (
    <AdmissionShell roles={[...CURATOR_ROLES]}>
      <StaffTrajectoriesBody />
    </AdmissionShell>
  )
}
