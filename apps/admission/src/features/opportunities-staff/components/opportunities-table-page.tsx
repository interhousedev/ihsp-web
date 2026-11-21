"use client"

import { isApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Input, Skeleton, StateView, StatusBadge } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { CURATOR_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { QueryError } from "../../shell/components/query-error"
import { useStaffOpportunities, useStaffOpportunityMutations, type StaffOppRow, type StaffOppState } from "../api"
import { OPP_KINDS, OpportunityEditDialog } from "./opportunity-edit-dialog"

const PAGE_SIZE = 25
const STATES: StaffOppState[] = ["all", "live", "archived"]
const select = "border-input bg-background h-10 rounded-md border px-3 text-sm"

function Body() {
  const t = useT("opportunitiesManage")
  const errorMessage = useErrorMessage()
  const [q, setQ] = useState("")
  const [kind, setKind] = useState("")
  const [state, setState] = useState<StaffOppState>("all")
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<{ id: string | null } | null>(null)
  const [deleting, setDeleting] = useState<StaffOppRow | null>(null)
  const list = useStaffOpportunities({ q, kind, state, page, pageSize: PAGE_SIZE })
  const { visibility, remove } = useStaffOpportunityMutations()
  const total = list.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filter = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(1)
  }

  function confirmDelete() {
    if (!deleting) return
    remove.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
      onError: (error) => {
        setDeleting(null)
        toast.error(isApiError(error) && error.status === 409 ? t("inUse") : errorMessage(error))
      },
    })
  }

  return (
    <div className={pageClass()}>
      <AppPageHeader
        icon="sparkles"
        title={t("title")}
        actions={<Button onClick={() => setEditing({ id: null })}>{t("add")}</Button>}
      />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <Input
          type="search"
          aria-label={t("search")}
          placeholder={t("search")}
          value={q}
          onChange={(e) => filter(setQ)(e.target.value)}
        />
        <select
          aria-label={t("kind")}
          className={select}
          value={kind}
          onChange={(e) => filter(setKind)(e.target.value)}
        >
          <option value="">{t("allKinds")}</option>
          {OPP_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`kinds.${k}`)}
            </option>
          ))}
        </select>
        <select
          aria-label={t("state")}
          className={select}
          value={state}
          onChange={(e) => filter(setState)(e.target.value as StaffOppState)}
        >
          {STATES.map((s) => (
            <option key={s} value={s}>
              {t(`states.${s}`)}
            </option>
          ))}
        </select>
      </div>
      {list.isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : list.isError ? (
        <QueryError error={list.error} onRetry={() => list.refetch()} />
      ) : list.data.items.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {list.data.items.map((o) => (
            <li key={o.id} className="bg-card flex flex-col gap-2 rounded-card border p-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-medium">{o.title}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {[t(`kinds.${o.kind}`), o.provider, o.country, o.registration_deadlines[0]]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              {o.archived ? <StatusBadge tone="neutral" label={t("archived")} /> : null}
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing({ id: o.id })}>
                  {t("edit")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={visibility.isPending}
                  onClick={() =>
                    visibility.mutate(
                      { id: o.id, archived: !o.archived },
                      { onError: (e) => toast.error(errorMessage(e)) },
                    )
                  }
                >
                  {o.archived ? t("unarchive") : t("archive")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(o)}>
                  {t("delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{t("total", { count: total })}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t("prev")}
          </Button>
          <span>{t("pageOf", { page, pages })}</span>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            {t("next")}
          </Button>
        </div>
      </div>
      <OpportunityEditDialog open={editing !== null} id={editing?.id ?? null} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("deleteTitle")}
        description={deleting?.title}
        confirmLabel={t("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

/** Staff table of every opportunity: search, filters, paging, edit, archive, delete. */
export function OpportunitiesTablePage() {
  return (
    <AdmissionShell roles={[...CURATOR_ROLES]}>
      <Body />
    </AdmissionShell>
  )
}
