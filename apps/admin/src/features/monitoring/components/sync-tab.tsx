"use client"

import { getAdminSyncRuns, keys, postSyncRun, type SyncRunItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Input } from "@ihsp/ui"
import { useMemo, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { PagedTable } from "../../shared/components/paged-table"
import { StatusBadge } from "../../shared/components/status-badge"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { MaterialsResync } from "./materials-resync"
import { StudentSyncs } from "./student-syncs"
import { SERVER_PAGE_SIZE, usePagedList } from "../../shared/hooks/use-paged-list"
import { col } from "../../shared/utils/columns"
import { TOUCH } from "../../shared/utils/touch"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function durationSeconds(run: SyncRunItem): number | null {
  if (!run.finished_at) return null
  return Math.max(0, Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000))
}

/** EMIS sync runs (ADM-14, UF-ADM-13) and a manual run for everyone or for one student. */
export function SyncTab() {
  const t = useT("monitoring.sync")
  const f = useFormatters()
  const source = usePagedList(keys.admin.syncRuns({}), (cursor, signal) =>
    getAdminSyncRuns({ cursor, limit: SERVER_PAGE_SIZE }, { signal }),
  )
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [userId, setUserId] = useState("")

  const trimmed = userId.trim()
  const validUser = trimmed === "" || UUID_PATTERN.test(trimmed)
  const run = useAdminMutation({
    mutationFn: () => postSyncRun(trimmed === "" ? {} : { user_id: trimmed }),
    invalidate: [keys.admin.syncRuns(), keys.admin.dashboard()],
    success: t("started"),
    onSuccess: () => {
      setConfirmOpen(false)
      setUserId("")
    },
  })

  const columns = useMemo(
    () => [
      col<SyncRunItem>("started", t("columns.started"), (item) => (
        <span className="font-medium">{f.dateTime(item.started_at)}</span>
      )),
      col<SyncRunItem>("duration", t("columns.duration"), (item) => {
        const seconds = durationSeconds(item)
        return seconds === null ? t("running") : t("seconds", { count: seconds })
      }),
      col<SyncRunItem>("status", t("columns.status"), (item) => (
        <StatusBadge status={item.finished_at ? item.status : "running"} />
      )),
      col<SyncRunItem>("stats", t("columns.stats"), (item) => (
        <span className="text-xs">
          {Object.entries(item.stats)
            .map(([key, value]) => `${key.replaceAll("_", " ")}: ${value}`)
            .join(" · ") || "—"}
        </span>
      )),
    ],
    [f, t],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <LabeledField
          label={t("userId")}
          htmlFor="sync-user"
          description={validUser ? t("userHint") : t("userInvalid")}
          className="max-w-sm"
        >
          <Input
            id="sync-user"
            value={userId}
            className={TOUCH}
            aria-invalid={!validUser}
            placeholder="00000000-0000-…"
            onChange={(event) => setUserId(event.target.value)}
          />
        </LabeledField>
        <Button type="button" className={TOUCH} disabled={!validUser} onClick={() => setConfirmOpen(true)}>
          {trimmed === "" ? t("runAll") : t("runOne")}
        </Button>
      </div>
      <MaterialsResync />
      <StudentSyncs />
      <PagedTable source={source} columns={columns} getRowId={(item) => item.id} emptyText={t("empty")} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={trimmed === "" ? t("confirmAllTitle") : t("confirmOneTitle")}
        description={trimmed === "" ? t("confirmAllDescription") : t("confirmOneDescription")}
        confirmLabel={t("run")}
        loading={run.isPending}
        onConfirm={() => run.mutate()}
      />
    </div>
  )
}
