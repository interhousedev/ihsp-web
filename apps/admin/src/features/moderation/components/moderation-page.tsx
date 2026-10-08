"use client"

import {
  getAdminModerationQueue,
  getAdminModerationSearch,
  keys,
  postAdminLinkDisable,
  postAdminLinkDismissReports,
  type ModerationItem,
} from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, CopyButton, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { ListToolbar, type ToolbarFilter } from "../../shared/components/list-toolbar"
import { PagedTable } from "../../shared/components/paged-table"
import { ReasonDialog } from "../../shared/components/reason-dialog"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { SERVER_PAGE_SIZE, useArrayList, usePagedList } from "../../shared/hooks/use-paged-list"
import { actionsCol, col } from "../../shared/utils/columns"
import { fullName } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"

const FILTER_KEYS = ["q"] as const
const INVALIDATE = [["admin", "moderation"]] as const

function targetOf(item: ModerationItem): string {
  const { link } = item
  return link.target_url ?? link.file?.name ?? link.title ?? "—"
}

/**
 * Moderation (ADM-13, UF-ADM-10): the queue of reported links, newest and most reported first, a search by short
 * ID, share URL or login, and the two decisions: disable with a reason (evidence is kept) or dismiss the reports.
 */
export function ModerationPage() {
  const t = useT("moderation")
  const f = useFormatters()
  const filters = useFilterState(FILTER_KEYS)
  const q = filters.values.q
  const [disabling, setDisabling] = useState<ModerationItem | null>(null)

  const queue = usePagedList(
    keys.admin.moderation.queue({}),
    (cursor, signal) => getAdminModerationQueue({ cursor, limit: SERVER_PAGE_SIZE }, { signal }),
    { enabled: q === null },
  )
  const search = useQuery({
    queryKey: keys.admin.moderation.search(q ?? ""),
    queryFn: ({ signal }) => getAdminModerationSearch({ q: q ?? "" }, { signal }),
    enabled: q !== null,
  })
  const searchSource = useArrayList<ModerationItem>(search)
  const source = q === null ? queue : searchSource

  const disable = useAdminMutation({
    mutationFn: ({ item, reason }: { item: ModerationItem; reason: string }) =>
      postAdminLinkDisable(item.link.id, { reason }),
    invalidate: INVALIDATE,
    success: t("disabledDone"),
    onSuccess: () => setDisabling(null),
  })
  const dismiss = useAdminMutation({
    mutationFn: (item: ModerationItem) => postAdminLinkDismissReports(item.link.id),
    invalidate: INVALIDATE,
    success: t("dismissedDone"),
  })

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [{ kind: "search", key: "q", label: t("search"), placeholder: t("searchPlaceholder") }],
    [t],
  )

  const columns = useMemo(
    () => [
      col<ModerationItem>("link", t("columns.link"), (item) => (
        <span className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs break-all">{item.link.slug}</span>
            <CopyButton value={item.link.url} label={t("copyUrl")} size="sm" />
          </span>
          <span className="text-muted-foreground text-xs">{t(`kind.${item.link.kind}`)}</span>
        </span>
      )),
      col<ModerationItem>("target", t("columns.target"), (item) => <span className="break-all">{targetOf(item)}</span>),
      col<ModerationItem>("owner", t("columns.owner"), (item) => fullName(item.owner)),
      col<ModerationItem>("reports", t("columns.reports"), (item) => (
        <span className="flex flex-col">
          <Badge variant={item.reports > 0 ? "destructive" : "outline"} className="w-fit">
            {item.reports}
          </Badge>
          {item.last_reported_at ? (
            <span className="text-muted-foreground text-xs">{f.dateTime(item.last_reported_at)}</span>
          ) : null}
        </span>
      )),
      col<ModerationItem>("hits", t("columns.hits"), (item) => item.link.hits),
      col<ModerationItem>("state", t("columns.state"), (item) =>
        item.link.disabled ? (
          <Badge variant="destructive">
            {item.disabled_reason ? t("disabledWithReason", { reason: item.disabled_reason }) : t("disabled")}
          </Badge>
        ) : item.link.revoked_at ? (
          <Badge variant="outline">{t("revoked")}</Badge>
        ) : (
          <Badge variant="secondary">{t("live")}</Badge>
        ),
      ),
      actionsCol<ModerationItem>(t("columns.actions"), (item) => (
        <>
          {!item.link.disabled ? (
            <Button
              type="button"
              variant="destructive"
              className={TOUCH}
              aria-label={t("disableFor", { slug: item.link.slug })}
              onClick={() => setDisabling(item)}
            >
              {t("disable")}
            </Button>
          ) : null}
          {item.reports > 0 ? (
            <Button
              type="button"
              variant="outline"
              className={TOUCH}
              aria-label={t("dismissFor", { slug: item.link.slug })}
              disabled={dismiss.isPending}
              onClick={() => dismiss.mutate(item)}
            >
              {t("dismiss")}
            </Button>
          ) : null}
        </>
      )),
    ],
    [dismiss, f, t],
  )

  return (
    <PageContainer title={t("title")} description={t("description")}>
      <PagedTable
        source={source}
        columns={columns}
        getRowId={(item) => item.link.id}
        emptyText={q === null ? t("emptyQueue") : t("emptySearch")}
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
      <ReasonDialog
        open={disabling !== null}
        onOpenChange={(open) => (open ? undefined : setDisabling(null))}
        title={t("disableTitle", { slug: disabling?.link.slug ?? "" })}
        description={t("disableDescription")}
        reasonLabel={t("reason")}
        confirmLabel={t("disable")}
        loading={disable.isPending}
        onSubmit={(reason) => disabling && disable.mutate({ item: disabling, reason })}
      />
    </PageContainer>
  )
}
