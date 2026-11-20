"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, ConfirmDialog, cn, Icons, Skeleton, StateView, StatusBadge } from "@ihsp/ui"
import { useState } from "react"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { AsideCard, SplitLayout } from "../../../components/lib/split-layout"
import { UnderlineTabs } from "../../../components/lib/underline-tabs"
import { ScrollFade } from "../../../components/scroll-fade"
import { toast } from "sonner"
import { CURATOR_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useRemoveDeadline, useStaffDeadlines, type Deadline } from "../api"
import { CreateDeadlineDialog } from "./create-deadline-dialog"
import { DeadlineDialog } from "./deadline-dialog"
import { QueryError } from "../../shell/components/query-error"

function Row({ item }: { item: Deadline }) {
  const t = useT("deadlines")
  const errorMessage = useErrorMessage()
  const remove = useRemoveDeadline()
  const format = useFormatters()
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  return (
    <li
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-card border p-3",
        item.status === "confirmed" ? "bg-success/10" : "bg-warning/10",
      )}
    >
      <div className="flex items-center gap-3">
        <LogoAvatar
          name={item.institution_name || t("unknownInstitution")}
          src={item.logo_url}
          fit={item.logo_fit}
          zoom={item.logo_zoom}
          className="size-8 ring-0"
        />
        <div className="flex flex-col">
          <span className="font-medium">{item.institution_name || t("unknownInstitution")}</span>
          <span className="text-muted-foreground text-xs">
            {t(`round.${item.round}`)} · {item.cycle}
          </span>
          <span className="text-muted-foreground text-xs">
            {item.local_date
              ? format.date(`${item.local_date}T00:00:00+05:00`, { year: "numeric", month: "long", day: "numeric" })
              : t("noDate")}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge
          tone={item.status === "confirmed" ? "success" : "warning"}
          label={item.status === "confirmed" ? t("status.confirmed") : t("view.pending")}
        />
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
  const [tab, setTab] = useState("all")
  const items = query.data ?? []
  const confirmed = items.filter((item) => item.status === "confirmed")
  const pending = items.filter((item) => item.status !== "confirmed")
  const undated = items.filter((item) => item.local_date === null).length
  const shown = tab === "confirmed" ? confirmed : tab === "pending" ? pending : items
  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (shown.length === 0)
    body = <StateView state="empty" icon={<Icons.calendar aria-hidden />} title={t("staffEmpty")} />
  else
    body = (
      <ScrollFade maxHeight="70vh">
        <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {shown.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </ul>
      </ScrollFade>
    )
  return (
    <AdmissionShell roles={[...CURATOR_ROLES]}>
      <div className={pageClass()}>
        <AppPageHeader
          icon="calendar"
          title={t("staffTitle")}
          actions={
            <Button type="button" size="sm" onClick={() => setCreating(true)}>
              {t("createButton")}
            </Button>
          }
        />
        {creating && <CreateDeadlineDialog open onOpenChange={setCreating} />}
        <SplitLayout
          aside={
            <>
              <AsideCard title={t("view.summaryTitle")} icon={<Icons.calendarEvent aria-hidden className="size-4" />}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-success/10 flex flex-col rounded-lg p-3">
                    <span className="text-lg font-semibold tabular-nums">{confirmed.length}</span>
                    <span className="text-muted-foreground text-xs">{t("status.confirmed")}</span>
                  </div>
                  <div className="bg-warning/10 flex flex-col rounded-lg p-3">
                    <span className="text-lg font-semibold tabular-nums">{pending.length}</span>
                    <span className="text-muted-foreground text-xs">{t("view.pending")}</span>
                  </div>
                </div>
              </AsideCard>
              {undated > 0 ? (
                <Alert>
                  <Icons.warning aria-hidden />
                  <AlertDescription>{t("view.undated", { count: undated })}</AlertDescription>
                </Alert>
              ) : null}
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <UnderlineTabs
              label={t("view.tabs")}
              value={tab}
              onValueChange={setTab}
              tabs={[
                { value: "all", label: t("view.all"), count: items.length, tone: "neutral" },
                { value: "confirmed", label: t("status.confirmed"), count: confirmed.length, tone: "success" },
                { value: "pending", label: t("view.pending"), count: pending.length, tone: "warning" },
              ]}
            />
            {body}
          </div>
        </SplitLayout>
      </div>
    </AdmissionShell>
  )
}
