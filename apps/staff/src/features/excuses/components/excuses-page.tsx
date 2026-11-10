"use client"

import type { ExcuseStatus } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Icons, PageContainer, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { useState } from "react"
import { useExcusesList } from "../hooks/use-excuses-list"
import { ExcuseCard } from "./excuse-card"
import { ExcuseCreateDialog } from "./excuse-create-dialog"
import { ExcuseDetailDialog } from "./excuse-detail-dialog"

const TABS = ["pending", "approved"] as const satisfies readonly ExcuseStatus[]

/** The curator's excuses: pending requests to decide and approved ones to end or revoke, plus a new exclusion. */
export function ExcusesPage() {
  const t = useT("excuses")
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("pending"))
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const list = useExcusesList(tab)

  return (
    <PageContainer
      title={t("title")}
      actions={
        <Button className="min-h-11 md:min-h-8" onClick={() => setCreating(true)}>
          <Icons.plusCircle data-icon="inline-start" aria-hidden />
          {t("create")}
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={(next) => void setTab(next as (typeof TABS)[number])}>
        <TabsList className="w-full justify-start sm:w-fit">
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value} className="min-h-11 md:min-h-7">
              {t(`tabs.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <QueryState query={list} rows={4} isEmpty={(items) => items.length === 0} emptyText={t(`empty.${tab}`)}>
        {(items) => (
          <div className="flex flex-col gap-2">
            <ul className="flex flex-col gap-2">
              {items.map((excuse) => (
                <ExcuseCard key={excuse.id} excuse={excuse} onOpen={() => setOpenId(excuse.id)} />
              ))}
            </ul>
            {list.hasNextPage ? (
              <Button
                variant="outline"
                className="min-h-11 self-center md:min-h-8"
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
      <ExcuseCreateDialog open={creating} onClose={() => setCreating(false)} />
    </PageContainer>
  )
}
