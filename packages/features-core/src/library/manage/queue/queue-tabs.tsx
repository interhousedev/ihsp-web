"use client"

import type { QueueTab } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { countLabel, QUEUE_TABS } from "./queue-utils"
import type { QueueCount } from "./use-queue-counts"

/** The five tabs with a count and the age of the oldest row ("N+" when the first page is full). */
export function QueueTabs({
  tab,
  counts,
  onTabChange,
}: {
  tab: QueueTab
  counts: Record<QueueTab, QueueCount>
  onTabChange: (tab: QueueTab) => void
}) {
  const t = useT("library.manage.queue")
  const format = useFormatters()
  return (
    <Tabs value={tab} onValueChange={(value) => onTabChange(value as QueueTab)}>
      <TabsList
        variant="line"
        aria-label={t("tabsLabel")}
        className="h-auto w-full justify-start gap-1 overflow-x-auto border-b pb-1"
      >
        {QUEUE_TABS.map((name) => {
          const count = counts[name]
          return (
            <TabsTrigger
              key={name}
              value={name}
              className="min-h-11 flex-none flex-col gap-0 px-3 md:min-h-9 md:flex-row md:gap-1.5"
            >
              <span className="flex items-center gap-1.5">
                {t(`tab.${name}`)}
                {count.rows !== null ? (
                  <Badge variant={count.rows > 0 ? "default" : "secondary"} className="min-w-5">
                    {countLabel(count.rows, count.hasMore)}
                  </Badge>
                ) : null}
              </span>
              {count.oldest ? (
                <span className="text-muted-foreground text-[0.7rem] font-normal">
                  {t("oldest", { age: format.relative(count.oldest) })}
                </span>
              ) : null}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
