"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, PageHeader, Skeleton, StateView, StatusBadge } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { CASELOAD_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useRemoveDeadline, useStaffDeadlines, type Deadline } from "../api"
import { CreateDeadlineDialog } from "./create-deadline-dialog"
import { DeadlineDialog } from "./deadline-dialog"

function Row({ item }: { item: Deadline }) {
  const t = useT("deadlines")
  const errorMessage = useErrorMessage()
  const remove = useRemoveDeadline()
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  return (
    <li className="bg-card flex flex-wrap items-center justify-between gap-2 rounded-card border p-3">
      <div className="flex flex-col">
        <span className="font-medium">
          {item.round} {item.cycle}
        </span>
        <span className="text-muted-foreground text-xs">{item.local_date ?? t("noDate")}</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge tone={item.status === "confirmed" ? "success" : "neutral"} label={t(`status.${item.status}`)} />
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
          {t("edit")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setRemoving(true)}>
          {t("remove")}
        </Button>
      </div>
      {editing && <DeadlineDialog item={item} open onOpenChange={setEditing} />}
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={t("removeTitle")}
        confirmLabel={t("remove")}
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(item.id, {
            onSuccess: () => setRemoving(false),
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      />
    </li>
  )
}

export function StaffDeadlinesPage() {
  const t = useT("deadlines")
  const query = useStaffDeadlines()
  const [creating, setCreating] = useState(false)
  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <StateView state="error" onRetry={() => void query.refetch()} />
  else if (query.data.length === 0) body = <StateView state="empty" title={t("staffEmpty")} />
  else
    body = (
      <ul className="flex flex-col gap-2">
        {query.data.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </ul>
    )
  return (
    <AdmissionShell roles={[...CASELOAD_ROLES]}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title={t("staffTitle")}
          actions={
            <Button type="button" size="sm" onClick={() => setCreating(true)}>
              {t("createButton")}
            </Button>
          }
        />
        {creating && <CreateDeadlineDialog open onOpenChange={setCreating} />}
        {body}
      </div>
    </AdmissionShell>
  )
}
