"use client"

import { getAdminExcuses, type Excuse } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useLocale, useT } from "@ihsp/i18n"
import { Button, PageContainer, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { useState } from "react"
import { usePagedList } from "../../shared/hooks/use-paged-list"
import { TOUCH } from "../../shared/utils/touch"
import { templateTitle } from "../utils/excuse-labels"
import { ExcuseDetailDialog } from "./excuse-detail-dialog"
import { ExcusePeriod } from "./excuse-period"
import { ExcuseStatusBadge } from "./excuse-status-badge"

const TABS = ["pending", "approved", "rejected", "all"] as const

function ExcuseRow({ excuse, onOpen }: { excuse: Excuse; onOpen: () => void }) {
  const t = useT("excuses")
  const locale = useLocale()
  const f = useFormatters()
  return (
    <li>
      <button
        type="button"
        aria-label={t("open", { name: excuse.student_name })}
        onClick={onOpen}
        className={`flex w-full flex-col gap-1 rounded-lg border p-3 text-left hover:bg-muted/50 ${TOUCH}`}
      >
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">{excuse.student_name}</span>
          <ExcuseStatusBadge status={excuse.status} />
        </span>
        <span className="text-sm text-muted-foreground">
          {templateTitle(excuse.template, locale)} · <ExcusePeriod excuse={excuse} />
        </span>
        <span className="text-xs text-muted-foreground">{f.dateTime(excuse.created_at)}</span>
      </button>
    </li>
  )
}

/** Every excuse of the school: filter by status, open one to decide or to write to its thread. */
export function ExcusesPage() {
  const t = useT("excuses")
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("pending"))
  const [openId, setOpenId] = useState<string | null>(null)
  const list = usePagedList<Excuse>(["admin", "excuses", "list", tab], (cursor, signal) =>
    getAdminExcuses({ ...(tab === "all" ? {} : { status: tab }), ...(cursor ? { cursor } : {}) }, { signal }),
  )
  return (
    <PageContainer title={t("title")}>
      <Tabs value={tab} onValueChange={(next) => void setTab(next as (typeof TABS)[number])}>
        <TabsList className="w-full justify-start sm:w-fit">
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value} className="min-h-11 md:min-h-7">
              {t(`tabs.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <QueryState
        query={{ ...list, data: list.isPending ? undefined : list.items, error: list.error as Error | null }}
        rows={4}
        isEmpty={(items) => items.length === 0}
        emptyText={t("empty")}
      >
        {(items) => (
          <div className="flex flex-col gap-2">
            <ul className="flex flex-col gap-2">
              {items.map((excuse) => (
                <ExcuseRow key={excuse.id} excuse={excuse} onOpen={() => setOpenId(excuse.id)} />
              ))}
            </ul>
            {list.hasNextPage ? (
              <Button
                variant="outline"
                className={`self-center ${TOUCH}`}
                disabled={list.isFetchingNextPage}
                onClick={list.fetchNextPage}
              >
                {t("loadMore")}
              </Button>
            ) : null}
          </div>
        )}
      </QueryState>
      <ExcuseDetailDialog id={openId} onClose={() => setOpenId(null)} />
    </PageContainer>
  )
}
