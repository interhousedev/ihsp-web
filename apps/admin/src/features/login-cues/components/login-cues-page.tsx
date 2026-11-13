"use client"

import {
  deleteAdminLoginCue,
  getAdminGroupsQuery,
  getAdminLoginCuesQuery,
  isApiError,
  postAdminLoginCuesBulkDelete,
  type LoginCueResponse,
} from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  IconPlus,
  IconTrash,
  PageContainer,
  StateView,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { downloadCsv } from "../../shared/utils/csv"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"
import { LoginCueBulkDialog } from "./login-cue-bulk-dialog"
import { LoginCueDialog } from "./login-cue-dialog"

/** The pasted-list line the bulk dialog parses: `login;full name`. */
function toLine(cue: LoginCueResponse): string {
  return `${cue.login_masked};${cue.full_name}`
}

const FILTER_KEYS = ["group_id"] as const

/** Login cues: names that students pick at registration instead of typing their EMIS login. Staff only. */
export function LoginCuesPage() {
  const t = useT("loginCues")
  const locale = useLocale()
  const filters = useFilterState(FILTER_KEYS)
  const groupId = filters.values.group_id ?? ""
  const [adding, setAdding] = useState(false)
  const [bulk, setBulk] = useState(false)
  const [deleting, setDeleting] = useState<LoginCueResponse | null>(null)
  const groups = useQuery(getAdminGroupsQuery())
  const cues = useQuery(getAdminLoginCuesQuery({ group_id: groupId || undefined }))
  const remove = useAdminMutation({
    mutationFn: (cue: LoginCueResponse) => deleteAdminLoginCue(cue.id),
    invalidate: [["admin", "login-cues"]],
    success: t("deleted"),
    onSuccess: () => setDeleting(null),
  })
  const rows = cues.data ?? []
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  const [deletingSelected, setDeletingSelected] = useState(false)
  // Only cues that are still in the visible list count as selected.
  const selected = rows.filter((cue) => picked.has(cue.id))
  const allSelected = rows.length > 0 && selected.length === rows.length
  const someSelected = selected.length > 0 && !allSelected
  const toggle = (id: string, on: boolean) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  const toggleAll = (on: boolean) => setPicked(on ? new Set(rows.map((cue) => cue.id)) : new Set())
  const removeSelected = useAdminMutation({
    mutationFn: (ids: string[]) => postAdminLoginCuesBulkDelete({ ids }),
    invalidate: [["admin", "login-cues"]],
    success: (data) => t("select.deleted", { count: data.deleted }),
    onSuccess: () => {
      setPicked(new Set())
      setDeletingSelected(false)
    },
  })
  const copySelected = async () => {
    await navigator.clipboard.writeText(selected.map(toLine).join("\n"))
    toast.success(t("select.copied", { count: selected.length }))
  }
  const exportSelected = () =>
    downloadCsv(t("select.csvName"), [
      [t("columns.name"), t("columns.group"), t("columns.login"), t("columns.status")],
      ...selected.map((cue) => [
        cue.full_name,
        cue.group_name,
        cue.login_masked,
        cue.consumed_at !== null ? t("status.used") : t("status.free"),
      ]),
    ])

  return (
    <PageContainer
      title={t("title")}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className={TOUCH} onClick={() => setBulk(true)}>
            {t("bulkAdd")}
          </Button>
          <Button type="button" className={TOUCH} onClick={() => setAdding(true)}>
            <IconPlus aria-hidden /> {t("add")}
          </Button>
        </div>
      }
    >
      <div className="mb-4 max-w-xs">
        <SelectField
          id="login-cues-group"
          aria-label={t("filterGroup")}
          value={groupId}
          emptyLabel={t("allGroups")}
          options={(groups.data ?? []).map((group) => ({ value: group.id, label: group.name }))}
          onChange={(value) => filters.set("group_id", value)}
        />
      </div>
      {cues.isPending ? (
        <StateView state="loading" />
      ) : cues.isError && isApiError(cues.error) && cues.error.status === 404 ? (
        <StateView state="empty" emptyText={t("disabled")} />
      ) : cues.isError ? (
        <StateView state="error" error={cues.error} onRetry={() => void cues.refetch()} />
      ) : rows.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={(checked) => toggleAll(checked === true)}
              />
              {t("select.all")}
            </label>
            {selected.length > 0 ? (
              <div role="toolbar" className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{t("select.count", { count: selected.length })}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => void copySelected()}>
                  {t("select.copy")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={exportSelected}>
                  {t("select.export")}
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => setDeletingSelected(true)}>
                  {t("select.delete")}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPicked(new Set())}>
                  {t("select.clear")}
                </Button>
              </div>
            ) : null}
          </div>
          <ul className="grid gap-2 md:hidden" aria-label={t("title")}>
            {rows.map((cue) => (
              <li key={cue.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <Checkbox
                  aria-label={t("select.row", { name: cue.full_name })}
                  checked={picked.has(cue.id)}
                  onCheckedChange={(checked) => toggle(cue.id, checked === true)}
                />
                <span className="grid flex-1 gap-1">
                  <span className="font-medium">{cue.full_name}</span>
                  <span className="text-muted-foreground text-sm">{cue.group_name}</span>
                  <span className="font-mono text-xs">{cue.login_masked}</span>
                  <StatusLabel consumed={cue.consumed_at !== null} />
                </span>
                <DeleteButton cue={cue} label={t("delete", { name: cue.full_name })} onDelete={setDeleting} />
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{t("columns.name")}</TableHead>
                  <TableHead>{t("columns.group")}</TableHead>
                  <TableHead>{t("columns.login")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead>{t("columns.created")}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t("columns.actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((cue) => (
                  <TableRow key={cue.id}>
                    <TableCell>
                      <Checkbox
                        aria-label={t("select.row", { name: cue.full_name })}
                        checked={picked.has(cue.id)}
                        onCheckedChange={(checked) => toggle(cue.id, checked === true)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{cue.full_name}</TableCell>
                    <TableCell>{cue.group_name}</TableCell>
                    <TableCell className="font-mono text-xs">{cue.login_masked}</TableCell>
                    <TableCell>
                      <StatusLabel consumed={cue.consumed_at !== null} />
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(cue.created_at))}
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-end">
                        <DeleteButton cue={cue} label={t("delete", { name: cue.full_name })} onDelete={setDeleting} />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      {adding ? <LoginCueDialog open onOpenChange={setAdding} defaultGroupId={groupId} /> : null}
      {bulk ? <LoginCueBulkDialog open onOpenChange={setBulk} defaultGroupId={groupId} /> : null}
      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (open ? undefined : setDeleting(null))}
          title={t("deleteTitle", { name: deleting.full_name })}
          description={t("deleteText")}
          confirmLabel={t("confirmDelete")}
          destructive
          loading={remove.isPending}
          onConfirm={() => remove.mutate(deleting)}
        />
      ) : null}
      {deletingSelected ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (open ? undefined : setDeletingSelected(false))}
          title={t("select.deleteTitle", { count: selected.length })}
          description={t("deleteText")}
          confirmLabel={t("confirmDelete")}
          destructive
          loading={removeSelected.isPending}
          onConfirm={() => removeSelected.mutate(selected.map((cue) => cue.id))}
        />
      ) : null}
    </PageContainer>
  )
}

function StatusLabel({ consumed }: { consumed: boolean }) {
  const t = useT("loginCues")
  return <Badge variant={consumed ? "secondary" : "outline"}>{consumed ? t("status.used") : t("status.free")}</Badge>
}

function DeleteButton({
  cue,
  label,
  onDelete,
}: {
  cue: LoginCueResponse
  label: string
  onDelete: (cue: LoginCueResponse) => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={TOUCH_ICON}
      aria-label={label}
      onClick={() => onDelete(cue)}
    >
      <IconTrash aria-hidden />
    </Button>
  )
}
