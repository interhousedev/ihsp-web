"use client"

import { cn, Icons, Pill, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { Fragment, useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react"

export type UnderlineTab = {
  value: string
  /** Already translated. */
  label: string
  /** A count pill after the label; omitted when undefined. */
  count?: number
  tone?: ComponentProps<typeof Pill>["tone"]
  icon: keyof typeof Icons
  /** Starts a new group: a divider separates it from the previous tab. */
  startsGroup?: boolean
}

const EDGE = 1

/**
 * The sub-page switcher: a panel of icon + label pills with one clear selected pill; the caller renders the panel
 * for `value`. On phones the row scrolls sideways with edge fades and keeps the selected pill in view; arrow keys move
 * between pills (Base UI tabs). `lead` renders a title block before the pills from 1280 px, so the bar reads as the
 * navigation of the bigger page it belongs to.
 */
export function UnderlineTabs({
  label,
  tabs,
  value,
  onValueChange,
  lead,
  className,
}: {
  label: string
  tabs: readonly UnderlineTab[]
  value: string
  onValueChange: (value: string) => void
  lead?: ReactNode
  className?: string
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

  const fade = "pointer-events-none absolute inset-y-0 z-10 w-10 from-muted to-transparent"
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(String(next))}>
      <div
        data-testid="subnav"
        className={cn(
          "bg-muted ring-hairline flex min-w-0 items-center gap-2 rounded-[1.625rem] p-1 ring-1",
          className,
        )}
      >
        {lead ? <div className="hidden shrink-0 items-center gap-2 ps-3 pe-1 xl:flex">{lead}</div> : null}
        {lead ? <span aria-hidden className="bg-hairline-strong hidden h-6 w-px shrink-0 xl:block" /> : null}
        <div className="relative min-w-0 flex-1">
          <TabsList
            ref={ref}
            onScroll={measure}
            aria-label={label}
            className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden h-auto! w-full min-w-0 justify-start gap-1 overflow-x-auto rounded-full bg-transparent p-0 ring-0 lg:flex-wrap lg:gap-0.5 lg:overflow-visible"
          >
            {tabs.map((tab, index) => {
              const Icon = Icons[tab.icon]
              return (
                <Fragment key={tab.value}>
                  {tab.startsGroup && index > 0 ? (
                    <span aria-hidden className="bg-hairline-strong mx-1 h-6 w-px flex-none self-center" />
                  ) : null}
                  <TabsTrigger
                    value={tab.value}
                    className="hover:bg-background/70 data-active:hover:bg-primary min-h-11 flex-none gap-2 rounded-full px-3.5 lg:gap-1.5 lg:px-2.5"
                  >
                    <Icon aria-hidden className="size-[18px] shrink-0" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                    {tab.count === undefined ? null : (
                      <Pill tone={tab.tone} className="h-5 px-2 text-xs tabular-nums">
                        {tab.count}
                      </Pill>
                    )}
                  </TabsTrigger>
                </Fragment>
              )
            })}
          </TabsList>
          {start ? <div aria-hidden data-tabs-fade="start" className={cn(fade, "start-0 bg-gradient-to-r")} /> : null}
          {end ? <div aria-hidden data-tabs-fade="end" className={cn(fade, "end-0 bg-gradient-to-l")} /> : null}
        </div>
      </div>
    </Tabs>
  )
}
