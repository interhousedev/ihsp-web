"use client"

import { deleteAdminLoginCue, getAdminGroupsQuery, getAdminLoginCuesQuery, type LoginCueResponse } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
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
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"
import { LoginCueBulkDialog } from "./login-cue-bulk-dialog"
import { LoginCueDialog } from "./login-cue-dialog"

/** Login cues: names that students pick at registration instead of typing their EMIS login. Staff only. */
export function LoginCuesPage() {
  const t = useT("loginCues")
  const locale = useLocale()
  const [groupId, setGroupId] = useState("")
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
          onChange={setGroupId}
        />
      </div>
      {cues.isPending ? (
        <StateView state="loading" />
      ) : cues.isError ? (
        <StateView state="error" error={cues.error} onRetry={() => void cues.refetch()} />
      ) : rows.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} />
      ) : (
        <>
          <ul className="grid gap-2 md:hidden" aria-label={t("title")}>
            {rows.map((cue) => (
              <li key={cue.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <span className="grid gap-1">
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
