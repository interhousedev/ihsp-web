"use client"

import { getAdminBroadcasts, keys, type Audience, type BroadcastItem, type BroadcastStatus } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons, PageContainer, buttonVariants } from "@ihsp/ui"
import Link from "next/link"
import { useMemo } from "react"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { StatusBadge } from "../../shared/components/status-badge"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { SERVER_PAGE_SIZE, usePagedList } from "../../shared/hooks/use-paged-list"
import { col } from "../../shared/utils/columns"
import { TOUCH } from "../../shared/utils/touch"

const FILTER_KEYS = ["status"] as const
const STATUSES: readonly BroadcastStatus[] = ["draft", "scheduled", "sending", "sent", "cancelled"]

function isStatus(value: string | null): value is BroadcastStatus {
  return value !== null && (STATUSES as readonly string[]).includes(value)
}

/** Broadcasts list (ADM-11): status filter, delivery counts, a link to the editor. */
export function BroadcastsPage() {
  const t = useT("broadcasts")
  const f = useFormatters()
  const filters = useFilterState(FILTER_KEYS)
  const status = isStatus(filters.values.status) ? filters.values.status : undefined
  const source = usePagedList(keys.admin.broadcasts.list({ status }), (cursor, signal) =>
    getAdminBroadcasts({ status, cursor, limit: SERVER_PAGE_SIZE }, { signal }),
  )

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [
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

  const audienceSummary = (audience: Audience): string => {
    if (audience.everyone) return t("audience.everyone")
    return [
      audience.roles.length > 0 ? audience.roles.map((role) => t(`audience.role.${role}`)).join(", ") : null,
      audience.group_ids.length > 0 ? t("audience.groupsCount", { count: audience.group_ids.length }) : null,
      audience.semesters.length > 0 ? t("audience.semestersList", { list: audience.semesters.join(", ") }) : null,
    ]
      .filter(Boolean)
      .join(" · ")
  }

  const columns = useMemo(
    () => [
      col<BroadcastItem>("title", t("columns.title"), (item) => (
        <Link
          href={`/broadcasts/edit/?id=${encodeURIComponent(item.id)}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {item.title}
        </Link>
      )),
      col<BroadcastItem>("status", t("columns.status"), (item) => <StatusBadge status={item.status} />),
      col<BroadcastItem>("audience", t("columns.audience"), (item) => audienceSummary(item.audience)),
      col<BroadcastItem>("when", t("columns.when"), (item) =>
        item.scheduled_at ? f.dateTime(item.scheduled_at) : f.dateTime(item.created_at),
      ),
      col<BroadcastItem>("delivery", t("columns.delivery"), (item) =>
        item.stats
          ? t("deliveryLine", { sent: item.stats.sent, failed: item.stats.failed, blocked: item.stats.blocked })
          : "—",
      ),
    ],
    // `audienceSummary` only reads `t`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f, t],
  )

  return (
    <PageContainer
      title={t("title")}
      actions={
        <Link href="/broadcasts/edit/" className={buttonVariants({ className: TOUCH })}>
          <Icons.add aria-hidden />
          {t("new")}
        </Link>
      }
    >
      <PagedTable
        source={source}
        columns={columns}
        getRowId={(item) => item.id}
        emptyText={t("empty")}
        toolbar={
          <ListToolbar
            filters={toolbarFilters}
            values={filters.values}
            onChange={(key, value) => filters.set(key as (typeof FILTER_KEYS)[number], value)}
            onReset={filters.reset}
            active={filters.active}
          />
        }
      />
    </PageContainer>
  )
}
