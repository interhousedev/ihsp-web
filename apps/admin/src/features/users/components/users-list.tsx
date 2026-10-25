"use client"

import { getAdminUsers, keys, postAdminUserBlock, type AdminUser, type Role } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button } from "@ihsp/ui"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ExportButton } from "../../shared/components/export-button"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { ReasonDialog } from "../../shared/components/reason-dialog"
import { StatusBadge } from "../../shared/components/status-badge"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { SERVER_PAGE_SIZE, usePagedList } from "../../shared/hooks/use-paged-list"
import { col, selectCol } from "../../shared/utils/columns"
import { downloadCsv } from "../../shared/utils/csv"
import { fetchAllPages } from "../../shared/utils/fetch-all-pages"
import { fullNameWithMiddle } from "../../shared/utils/names"
import { userStatusParam } from "../../shared/utils/status-param"

export const ROLES: readonly Role[] = ["student", "teacher", "admin", "lms_admin", "lms_creator", "librarian"]
const FILTER_KEYS = ["query", "role", "status"] as const
const STATUSES = ["active", "pending_activation", "blocked", "deactivated"] as const

function isRole(value: string | null): value is Role {
  return value !== null && (ROLES as readonly string[]).includes(value)
}

type Blocking = { users: AdminUser[]; clear: () => void }

/** Users & roles list (ADM-5): search, role and status filters; selected users can be exported or blocked together. */
export function UsersList() {
  const t = useT("users")
  const tSel = useT("shared.selection")
  const tAccount = useT("account")
  const f = useFormatters()
  const [blocking, setBlocking] = useState<Blocking | null>(null)
  const blockSelected = useAdminMutation<{ users: AdminUser[]; reason: string }, number>({
    mutationFn: async ({ users, reason }) => {
      const open = users.filter((user) => user.status !== "blocked")
      for (const user of open) await postAdminUserBlock(user.id, { reason })
      return open.length
    },
    invalidate: [keys.admin.users.all(), keys.admin.students.all(), keys.admin.teachers.all()],
    success: (count) => tSel("blockSelectedDone", { count }),
    onSuccess: () => {
      blocking?.clear()
      setBlocking(null)
    },
  })
  const filters = useFilterState(FILTER_KEYS)
  const params = useMemo(
    () => ({
      query: filters.values.query ?? undefined,
      role: isRole(filters.values.role) ? filters.values.role : undefined,
      status: userStatusParam(filters.values.status),
    }),
    [filters.values],
  )
  const source = usePagedList(keys.admin.users.list(params), (cursor, signal) =>
    getAdminUsers({ ...params, cursor, limit: SERVER_PAGE_SIZE }, { signal }),
  )

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [
      { kind: "search", key: "query", label: t("filters.query"), placeholder: t("filters.queryPlaceholder") },
      {
        kind: "select",
        key: "role",
        label: t("filters.role"),
        allLabel: t("filters.allRoles"),
        options: ROLES.map((role) => ({ value: role, label: t(`roles.${role}`) })),
      },
      {
        kind: "select",
        key: "status",
        label: t("filters.status"),
        allLabel: t("filters.allStatuses"),
        options: STATUSES.map((value) => ({ value, label: t(`status.${value}`) })),
      },
    ],
    [t],
  )

  const columns = useMemo(
    () => [
      selectCol<AdminUser>({
        all: tSel("selectAll"),
        row: (user) => tSel("selectRow", { name: fullNameWithMiddle(user) }),
      }),
      col<AdminUser>(
        "name",
        t("columns.name"),
        (user) => (
          <Link
            href={`/users/view/?id=${encodeURIComponent(user.id)}`}
            className="font-medium underline-offset-4 hover:underline"
          >
            {fullNameWithMiddle(user)}
          </Link>
        ),
        { sort: fullNameWithMiddle },
      ),
      col<AdminUser>("login", t("columns.login"), (user) => user.login ?? "—", { sort: (user) => user.login }),
      col<AdminUser>(
        "roles",
        t("columns.roles"),
        (user) => (
          <span className="flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <Badge key={role} variant={role === "admin" ? "default" : "outline"}>
                {t(`roles.${role}`)}
              </Badge>
            ))}
          </span>
        ),
        { sort: (user) => user.roles.map((role) => t(`roles.${role}`)).join(" ") },
      ),
      col<AdminUser>(
        "status",
        t("columns.status"),
        (user) => (
          <span className="flex flex-wrap gap-1">
            <StatusBadge status={user.status} />
            {user.mail_suspended ? <Badge variant="destructive">{t("mailSuspended")}</Badge> : null}
          </span>
        ),
        { sort: (user) => user.status },
      ),
      col<AdminUser>(
        "last_login",
        t("columns.lastLogin"),
        (user) => (user.last_login_at ? f.dateTime(user.last_login_at) : "—"),
        { sort: (user) => user.last_login_at },
      ),
    ],
    [f, t, tSel],
  )

  function usersCsv(rows: AdminUser[]) {
    downloadCsv("users.csv", [
      [t("columns.name"), t("columns.login"), t("columns.roles"), t("columns.status"), t("columns.lastLogin")],
      ...rows.map((user) => [
        fullNameWithMiddle(user),
        user.login,
        user.roles.join(" "),
        user.status,
        user.last_login_at,
      ]),
    ])
  }

  async function exportCsv() {
    usersCsv(await fetchAllPages((cursor) => getAdminUsers({ ...params, cursor, limit: SERVER_PAGE_SIZE })))
  }

  return (
    <>
      <PagedTable
        source={source}
        columns={columns}
        getRowId={(user) => user.id}
        emptyText={t("empty")}
        renderSelectionActions={(selected, clear) => (
          <>
            <ExportButton label={tSel("exportSelected")} onExport={async () => usersCsv(selected)} />
            <Button
              type="button"
              variant="destructive"
              disabled={selected.every((user) => user.status === "blocked")}
              onClick={() => setBlocking({ users: selected, clear })}
            >
              {tSel("blockSelected")}
            </Button>
          </>
        )}
        toolbar={
          <ListToolbar
            filters={toolbarFilters}
            values={filters.values}
            onChange={(key, value) => filters.set(key as (typeof FILTER_KEYS)[number], value)}
            onReset={filters.reset}
            active={filters.active}
          >
            <ExportButton onExport={exportCsv} />
          </ListToolbar>
        }
      />
      <ReasonDialog
        open={blocking !== null}
        onOpenChange={(open) => !open && setBlocking(null)}
        title={tSel("blockSelectedTitle", { count: blocking?.users.length ?? 0 })}
        description={tAccount("blockDescription")}
        confirmLabel={tAccount("block")}
        reasonLabel={tAccount("reason")}
        loading={blockSelected.isPending}
        onSubmit={(reason) => {
          if (blocking) blockSelected.mutate({ users: blocking.users, reason })
        }}
      />
    </>
  )
}
