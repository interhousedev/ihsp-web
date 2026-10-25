"use client"

import type { QueueTab } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { useCallback, useEffect, useRef, useState } from "react"
import { countLabel, QUEUE_TABS } from "./queue-utils"
import type { QueueCount } from "./use-queue-counts"

/** Which edges of a horizontally scrolling strip hide more content (for the fade hints). */
function useEdgeHints() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [hints, setHints] = useState({ start: false, end: false })
  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const start = el.scrollLeft > 2
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
    setHints((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [])
  useEffect(() => {
    update()
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [update])
  return { ref, hints, update }
}

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
  const { ref, hints, update } = useEdgeHints()
  return (
    <Tabs value={tab} onValueChange={(value) => onTabChange(value as QueueTab)} className="relative min-w-0">
      <TabsList
        ref={ref}
        onScroll={update}
        variant="line"
        aria-label={t("tabsLabel")}
        className="h-auto w-full min-w-0 max-w-full justify-start gap-1 overflow-x-auto overflow-y-hidden border-b pb-1 [scrollbar-width:none]"
      >
        {QUEUE_TABS.map((name) => {
          const count = counts[name]
          return (
            <TabsTrigger
              key={name}
              value={name}
              className="min-h-11 shrink-0 flex-none flex-col gap-0 px-3 whitespace-nowrap md:min-h-9 md:flex-row md:gap-1.5"
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
      {hints.start ? (
        <span
          aria-hidden="true"
          data-testid="queue-tabs-fade-start"
          className="from-background pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r to-transparent"
        />
      ) : null}
      {hints.end ? (
        <span
          aria-hidden="true"
          data-testid="queue-tabs-fade-end"
          className="from-background pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l to-transparent"
        />
      ) : null}
    </Tabs>
  )
}
