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
import {
  useStaffInstitutionMutations,
  useStaffInstitutions,
  type InstitutionStatus,
  type StaffInstitution,
} from "../universities-api"
import { CardDialog } from "./card-dialog"
import { INSTITUTION_STATUSES, UniversityEditDialog } from "./university-edit-dialog"

const PAGE_SIZE = 25
const select = "border-input bg-background h-10 rounded-md border px-3 text-sm"
const TONES = { published: "success", provisional: "neutral", archived: "neutral" } as const

function Body() {
  const t = useT("universitiesManage")
  const errorMessage = useErrorMessage()
  const [cardId, setCardId] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [country, setCountry] = useState("")
  const [status, setStatus] = useState<"" | InstitutionStatus>("")
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<{ item: StaffInstitution | null } | null>(null)
  const [deleting, setDeleting] = useState<StaffInstitution | null>(null)
  const list = useStaffInstitutions({ q, country, status, page, pageSize: PAGE_SIZE })
  const { update, remove } = useStaffInstitutionMutations()
  const total = list.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filter =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v)
      setPage(1)
    }

  function hide(i: StaffInstitution) {
    update.mutate(
      { id: i.id, body: { status: i.status === "archived" ? "published" : "archived" }, lock_version: i.lock_version },
      { onError: (e) => toast.error(errorMessage(e)) },
    )
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
        icon="search"
        title={t("title")}
        actions={<Button onClick={() => setEditing({ item: null })}>{t("add")}</Button>}
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
          aria-label={t("country")}
          className={select}
          value={country}
          onChange={(e) => filter(setCountry)(e.target.value)}
        >
          <option value="">{t("allCountries")}</option>
          {(list.data?.countries ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label={t("status")}
          className={select}
          value={status}
          onChange={(e) => filter(setStatus)(e.target.value as "" | InstitutionStatus)}
        >
          <option value="">{t("allStatuses")}</option>
          {INSTITUTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`statuses.${s}`)}
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
          {list.data.items.map((i) => (
            <li key={i.id} className="bg-card flex flex-col gap-2 rounded-card border p-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-medium">{i.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {[i.country, i.city, i.website_domain].filter(Boolean).join(" · ")}
                </span>
              </div>
              <StatusBadge tone={TONES[i.status]} label={t(`statuses.${i.status}`)} />
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="ghost" onClick={() => setCardId(i.id)}>
                  {t("card")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing({ item: i })}>
                  {t("edit")}
                </Button>
                <Button size="sm" variant="ghost" disabled={update.isPending} onClick={() => hide(i)}>
                  {i.status === "archived" ? t("show") : t("hide")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(i)}>
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
      <CardDialog institution={list.data?.items.find((i) => i.id === cardId) ?? null} onClose={() => setCardId(null)} />
      <UniversityEditDialog
        open={editing !== null}
        institution={editing?.item ?? null}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("deleteTitle")}
        description={deleting?.name}
        confirmLabel={t("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

/** Staff table of the university list: search, country and status filters, paging, edit, hide, delete. */
export function UniversitiesTablePage() {
  return (
    <AdmissionShell roles={[...CURATOR_ROLES]}>
      <Body />
    </AdmissionShell>
  )
}
