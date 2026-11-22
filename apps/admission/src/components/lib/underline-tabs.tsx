"use client"

import { cn, Icons, Pill, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react"

export type UnderlineTab = {
  value: string
  /** Already translated. */
  label: string
  /** A count pill after the label; omitted when undefined. */
  count?: number
  tone?: ComponentProps<typeof Pill>["tone"]
  icon?: keyof typeof Icons
}

const EDGE = 1

/**
 * A scrollable underline tab strip with optional icon and count pill per tab; the caller renders the panel for `value`.
 * The strip fades on the side where tabs are cut off, and the selected tab is scrolled into view.
 */
export function UnderlineTabs({
  label,
  tabs,
  value,
  onValueChange,
  hideIconsBelowXl,
}: {
  label: string
  tabs: readonly UnderlineTab[]
  value: string
  onValueChange: (value: string) => void
  /** Drops the icons below the 2xl breakpoint so a long strip fits next to a sidebar. */
  hideIconsBelowXl?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [start, setStart] = useState(false)
  const [end, setEnd] = useState(false)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const left = Math.abs(el.scrollLeft)
    setStart(left > EDGE)
    setEnd(left + el.clientWidth < el.scrollWidth - EDGE)
  }, [])

  useEffect(() => {
    measure()
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure, tabs])

  useEffect(() => {
    const selected = ref.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
    selected?.scrollIntoView?.({ inline: "nearest", block: "nearest" })
  }, [value])

  const fade = "pointer-events-none absolute inset-y-0 z-10 w-8 from-background to-transparent"
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(String(next))}>
      <div className="relative min-w-0">
        <TabsList
          ref={ref}
          onScroll={measure}
          variant="line"
          aria-label={label}
          className="border-hairline [scrollbar-width:none] [&::-webkit-scrollbar]:hidden h-auto! w-full min-w-0 justify-start gap-1 overflow-x-auto border-b p-0"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon ? Icons[tab.icon] : null
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="min-h-11 flex-none px-3 md:min-h-9 after:bottom-0!"
              >
                {Icon ? <Icon aria-hidden className={cn("size-4", hideIconsBelowXl && "max-2xl:hidden")} /> : null}
                {tab.label}
                {tab.count === undefined ? null : (
                  <Pill tone={tab.tone} className="h-5 px-2 text-xs">
                    {tab.count}
                  </Pill>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>
        {start ? (
          <div aria-hidden data-tabs-fade="start" className={cn(fade, "start-0 bg-gradient-to-r")} />
        ) : null}
        {end ? <div aria-hidden data-tabs-fade="end" className={cn(fade, "end-0 bg-gradient-to-l")} /> : null}
      </div>
    </Tabs>
  )
}
