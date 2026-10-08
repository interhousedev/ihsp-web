"use client"

import { getAdminUsers, keys, type AdminUser, type Role } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import Link from "next/link"
import { useMemo } from "react"
import { ExportButton } from "../../shared/components/export-button"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { StatusBadge } from "../../shared/components/status-badge"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { SERVER_PAGE_SIZE, usePagedList } from "../../shared/hooks/use-paged-list"
import { col } from "../../shared/utils/columns"
import { downloadCsv } from "../../shared/utils/csv"
import { fetchAllPages } from "../../shared/utils/fetch-all-pages"
import { fullNameWithMiddle } from "../../shared/utils/names"
import { userStatusParam } from "../../shared/utils/status-param"

export const ROLES: readonly Role[] = ["student", "teacher", "admin", "lms_admin"]
const FILTER_KEYS = ["query", "role", "status"] as const
const STATUSES = ["active", "pending_activation", "blocked", "deactivated"] as const

function isRole(value: string | null): value is Role {
  return value !== null && (ROLES as readonly string[]).includes(value)
}

/** Users & roles list (ADM-5): search, role and status filters. */
export function UsersList() {
  const t = useT("users")
  const f = useFormatters()
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
      col<AdminUser>("name", t("columns.name"), (user) => (
        <Link
          href={`/users/view/?id=${encodeURIComponent(user.id)}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {fullNameWithMiddle(user)}
        </Link>
      )),
      col<AdminUser>("login", t("columns.login"), (user) => user.login ?? "—"),
      col<AdminUser>("roles", t("columns.roles"), (user) => (
        <span className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role} variant={role === "admin" ? "default" : "outline"}>
              {t(`roles.${role}`)}
            </Badge>
          ))}
        </span>
      )),
      col<AdminUser>("status", t("columns.status"), (user) => (
        <span className="flex flex-wrap gap-1">
          <StatusBadge status={user.status} />
          {user.mail_suspended ? <Badge variant="destructive">{t("mailSuspended")}</Badge> : null}
        </span>
      )),
      col<AdminUser>("last_login", t("columns.lastLogin"), (user) =>
        user.last_login_at ? f.dateTime(user.last_login_at) : "—",
      ),
    ],
    [f, t],
  )

  async function exportCsv() {
    const rows = await fetchAllPages((cursor) => getAdminUsers({ ...params, cursor, limit: SERVER_PAGE_SIZE }))
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

  return (
    <PagedTable
      source={source}
      columns={columns}
      getRowId={(user) => user.id}
      emptyText={t("empty")}
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
  )
}
