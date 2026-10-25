"use client"

import {
  adminFeedbackKeys,
  getAdminFeedback,
  type AdminFeedbackArea,
  type AdminFeedbackKind,
  type AdminFeedbackListItem,
  type AdminFeedbackListParams,
  type AdminFeedbackStatus,
} from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  PageContainer,
  StateView,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ihsp/ui"
import Link from "next/link"
import { useMemo } from "react"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { usePagedList } from "../../shared/hooks/use-paged-list"
import { TOUCH } from "../../shared/utils/touch"
import { FeedbackStatusBadge } from "./feedback-status-badge"

const FILTER_KEYS = ["status", "kind", "area"] as const
const PAGE_SIZE = 20

const STATUSES: readonly AdminFeedbackStatus[] = ["new", "in_review", "planned", "done", "rejected"]
const KINDS: readonly AdminFeedbackKind[] = ["idea", "bug", "other"]
const AREAS: readonly AdminFeedbackArea[] = [
  "id",
  "my",
  "staff",
  "admin",
  "lms",
  "library",
  "share",
  "bot",
  "ai",
  "notebooks",
  "mail",
  "other",
]

/** The URL filter value when it is one of the allowed values; unknown values are dropped. */
function pick<T extends string>(list: readonly T[], value: string | null): T | undefined {
  return list.find((item) => item === value)
}

/** The URL filter values as list parameters. */
function paramsOf(values: Record<(typeof FILTER_KEYS)[number], string | null>): AdminFeedbackListParams {
  return {
    status: pick(STATUSES, values.status),
    kind: pick(KINDS, values.kind),
    area: pick(AREAS, values.area),
  }
}

/** Call for improvements (admin): what users sent from the website and the bot, filtered and paged by cursor. */
export function CallForImprovementsPage() {
  const t = useT("callForImprovements")
  const filters = useFilterState(FILTER_KEYS)
  const params = paramsOf(filters.values)
  const list = usePagedList(adminFeedbackKeys.list(params), (cursor, signal) =>
    getAdminFeedback({ ...params, cursor, limit: PAGE_SIZE }, { signal }),
  )

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [
      {
        kind: "select",
        key: "status",
        label: t("filter.status"),
        allLabel: t("allStatuses"),
        options: STATUSES.map((value) => ({ value, label: t(`status.${value}`) })),
      },
      {
        kind: "select",
        key: "kind",
        label: t("filter.kind"),
        allLabel: t("allKinds"),
        options: KINDS.map((value) => ({ value, label: t(`kind.${value}`) })),
      },
      {
        kind: "select",
        key: "area",
        label: t("filter.area"),
        allLabel: t("allAreas"),
        options: AREAS.map((value) => ({ value, label: t(`area.${value}`) })),
      },
    ],
    [t],
  )

  const rows = list.items
  const toolbar = (
    <ListToolbar
      filters={toolbarFilters}
      values={filters.values}
      onChange={(key, value) => filters.set(key as (typeof FILTER_KEYS)[number], value)}
      onReset={filters.reset}
      active={filters.active}
    />
  )

  return (
    <PageContainer title={t("title")}>
      <div className="flex flex-col gap-4">
        {toolbar}
        {list.isPending ? (
          <StateView state="loading" rows={5} />
        ) : list.isError ? (
          <StateView state="error" error={list.error} onRetry={list.refetch} />
        ) : rows.length === 0 ? (
          <StateView state="empty" emptyText={filters.active ? t("emptyFiltered") : t("empty")} />
        ) : (
          <>
            <ul className="grid gap-2 md:hidden" aria-label={t("title")}>
              {rows.map((item) => (
                <li key={item.id} className="grid gap-2 rounded-lg border p-3">
                  <FeedbackTitleLink item={item} />
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    <FeedbackStatusBadge status={item.status} />
                    <Badge variant="outline">{t(`kind.${item.kind}`)}</Badge>
                    <Badge variant="outline">{t(`area.${item.area}`)}</Badge>
                  </span>
                  <ReporterLine item={item} />
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.title")}</TableHead>
                    <TableHead>{t("columns.kind")}</TableHead>
                    <TableHead>{t("columns.area")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead>{t("columns.reporter")}</TableHead>
                    <TableHead>{t("columns.received")}</TableHead>
                    <TableHead>{t("columns.replies")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((item) => (
                    <FeedbackRow key={item.id} item={item} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        {list.hasNextPage ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              className={TOUCH}
              disabled={list.isFetchingNextPage}
              onClick={list.fetchNextPage}
            >
              {t("loadMore")}
            </Button>
          </div>
        ) : null}
      </div>
    </PageContainer>
  )
}

function FeedbackRow({ item }: { item: AdminFeedbackListItem }) {
  const t = useT("callForImprovements")
  const f = useFormatters()
  return (
    <TableRow>
      <TableCell className="max-w-xs">
        <FeedbackTitleLink item={item} />
      </TableCell>
      <TableCell>{t(`kind.${item.kind}`)}</TableCell>
      <TableCell>{t(`area.${item.area}`)}</TableCell>
      <TableCell>
        <FeedbackStatusBadge status={item.status} />
      </TableCell>
      <TableCell>
        <ReporterLink item={item} />
      </TableCell>
      <TableCell>{f.dateTime(item.created_at)}</TableCell>
      <TableCell>{item.response_count}</TableCell>
    </TableRow>
  )
}

function FeedbackTitleLink({ item }: { item: AdminFeedbackListItem }) {
  return (
    <Link
      href={`/call-for-improvements/view/?id=${encodeURIComponent(item.id)}`}
      className="line-clamp-2 font-medium underline-offset-4 hover:underline"
    >
      {item.title}
    </Link>
  )
}

function ReporterLink({ item }: { item: AdminFeedbackListItem }) {
  return (
    <Link
      href={`/users/view/?id=${encodeURIComponent(item.reporter.user_id)}`}
      className="underline-offset-4 hover:underline"
    >
      {item.reporter.display_name}
    </Link>
  )
}

function ReporterLine({ item }: { item: AdminFeedbackListItem }) {
  const t = useT("callForImprovements")
  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
      <ReporterLink item={item} />
      {item.reporter.group_name ? <span>{item.reporter.group_name}</span> : null}
      <span>
        {t("columns.replies")}: {item.response_count}
      </span>
    </span>
  )
}
