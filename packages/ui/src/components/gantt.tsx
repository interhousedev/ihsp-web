"use client"

// Adapted from the personal component library (planning/gantt, Kibo UI, MIT): the same anatomy (sticky sidebar,
// month + day header, feature rows, today marker) rebuilt read-only on plain pixels: no drag-and-drop, jotai,
// context menu or hard-coded English; every label comes from the caller.

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react"

import { cn } from "../lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export const GANTT_DAY_MS = 86_400_000

export type GanttTone = "primary" | "success" | "danger" | "warning" | "muted"

export type GanttItem = {
  id: string
  /** UTC midnight of the first day. */
  start: number
  /** UTC midnight of the last day (inclusive). */
  end: number
  tone: GanttTone
  /** `bar` spans start..end; `flag` is a one-day marker. */
  shape: "bar" | "flag"
  /** Text inside a bar (or next to a flag). */
  label: string
  /** More items on the same day, shown as a count on a flag. */
  count?: number
  /** Accessible name. */
  ariaLabel: string
  /** Hover content. */
  tooltip: ReactNode
}

export type GanttRow = {
  id: string
  /** Empty together with no items: the row draws nothing but its group heading. */
  label: string
  /** Rows with the same group value are listed under one group heading. */
  group: string
  items: GanttItem[]
}

const TONE: Record<GanttTone, string> = {
  primary: "bg-primary/20 border-primary/70 text-foreground",
  success: "bg-success/20 border-success/70 text-foreground",
  danger: "bg-destructive/20 border-destructive/70 text-foreground",
  warning: "bg-warning/25 border-warning/80 text-foreground",
  muted: "bg-muted border-border text-muted-foreground",
}
const FLAG_TONE: Record<GanttTone, string> = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-white",
  danger: "bg-destructive text-destructive-foreground",
  warning: "bg-warning text-foreground",
  muted: "bg-muted-foreground text-background",
}

const ROW_PX = 40
const HEAD_PX = 56

/**
 * A read-only timeline: rows of bars and flags over a day axis inside one scroll container (both axes), a sticky
 * sidebar and header, a "today" line. Hover shows `item.tooltip`; click or Enter calls `onSelect`.
 */
export function Gantt({
  rows,
  groups,
  groupActions,
  start,
  end,
  today,
  dayWidth,
  sidebarWidth = 132,
  todayLabel,
  ariaLabel,
  monthLabel,
  dayLabel,
  weekdayLabel,
  onSelect,
  className,
}: {
  rows: GanttRow[]
  /** Group id to heading. Rows of a group missing here render without a heading. */
  groups: Record<string, string>
  /** Optional control (for example an add button) shown next to a group heading. */
  groupActions?: Record<string, ReactNode>
  start: number
  end: number
  today: number
  dayWidth: number
  sidebarWidth?: number
  todayLabel: string
  ariaLabel: string
  monthLabel: (time: number) => string
  dayLabel: (time: number) => string
  weekdayLabel: (time: number) => string
  onSelect: (id: string) => void
  className?: string
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const days = Math.round((end - start) / GANTT_DAY_MS) + 1
  const width = days * dayWidth
  const x = (time: number) => ((time - start) / GANTT_DAY_MS) * dayWidth

  const months = useMemo(() => {
    const out: { at: number; days: number }[] = []
    for (let i = 0; i < days; i += 1) {
      const time = start + i * GANTT_DAY_MS
      const date = new Date(time)
      const first = date.getUTCDate() === 1
      if (first || out.length === 0) out.push({ at: time, days: 1 })
      else out[out.length - 1]!.days += 1
    }
    return out
  }, [start, days])

  // Open on today (a third of the way in), again when the zoom changes.
  useEffect(() => {
    const node = scroller.current
    if (!node) return
    const target = x(today) - (node.clientWidth - sidebarWidth) / 3
    node.scrollLeft = Math.max(0, target)
    // x depends on start and dayWidth only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayWidth, start, today, sidebarWidth])

  const showDays = dayWidth >= 18
  const gridStep = dayWidth >= 18 ? dayWidth : dayWidth * 7
  const grid: CSSProperties = {
    backgroundImage: "linear-gradient(to right, var(--color-border) 1px, transparent 1px)",
    backgroundSize: `${gridStep}px 100%`,
    backgroundPosition: dayWidth >= 18 ? "0 0" : `${(7 - ((new Date(start).getUTCDay() + 6) % 7)) % 7 * dayWidth}px 0`,
    opacity: 0.6,
  }
  const todayInRange = today >= start && today <= end
  const content: ReactNode[] = []
  let lastGroup: string | null = null
  for (const row of rows) {
    if (row.group !== lastGroup && groups[row.group]) {
      content.push(
        <div key={`g:${row.group}`} className="relative flex h-10" style={{ width: sidebarWidth + width }}>
          <div
            className="bg-muted/70 text-muted-foreground sticky left-0 z-20 flex w-full items-center px-3 text-xs"
            style={{ width: sidebarWidth + width }}
          >
            <span className="sticky left-3 flex items-center gap-1 normal-case">
              <span className="font-semibold tracking-wide uppercase">{groups[row.group]}</span>
              {groupActions?.[row.group]}
            </span>
          </div>
        </div>,
      )
    }
    lastGroup = row.group
    // A row without label and items only stands for its group heading.
    if (row.items.length === 0 && !row.label) continue
    content.push(
      <div key={row.id} className="relative flex" style={{ height: ROW_PX, width: sidebarWidth + width }}>
        <div
          className="bg-card text-foreground sticky left-0 z-20 flex shrink-0 items-center border-r px-3 text-xs font-medium"
          style={{ width: sidebarWidth }}
        >
          <span className="line-clamp-2 break-words" title={row.label}>
            {row.label}
          </span>
        </div>
        <div className="relative shrink-0" style={{ width }}>
          <div className="pointer-events-none absolute inset-0" style={grid} aria-hidden />
          {row.items.map((item) => (
            <GanttBlock
              key={item.id}
              item={item}
              left={x(item.start)}
              dayWidth={dayWidth}
              sidebarWidth={sidebarWidth}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>,
    )
  }

  return (
    <div
      ref={scroller}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      className={cn("bg-card rounded-card relative isolate overflow-auto border overscroll-contain", className)}
    >
      <div className="relative" style={{ width: sidebarWidth + width }}>
        <div
          className="bg-card sticky top-0 z-30 flex border-b"
          style={{ height: HEAD_PX, width: sidebarWidth + width }}
        >
          <div className="bg-card sticky left-0 z-40 shrink-0 border-r" style={{ width: sidebarWidth }} />
          <div className="relative flex shrink-0 flex-col" style={{ width }}>
            <div className="flex h-7 border-b">
              {months.map((month) => (
                <div
                  key={month.at}
                  className="shrink-0 border-l first:border-l-0"
                  style={{ width: month.days * dayWidth }}
                >
                  <span
                    className="text-foreground sticky inline-block px-2 py-1 text-xs font-semibold whitespace-nowrap"
                    style={{ left: sidebarWidth }}
                  >
                    {monthLabel(month.at)}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-muted-foreground flex h-7 text-[11px]">
              {Array.from({ length: days }, (_, index) => {
                const time = start + index * GANTT_DAY_MS
                const weekday = new Date(time).getUTCDay()
                const monday = weekday === 1
                if (!showDays && !monday) return <span key={time} className="shrink-0" style={{ width: dayWidth }} />
                return (
                  <span
                    key={time}
                    className={cn(
                      "shrink-0 overflow-visible leading-7 whitespace-nowrap",
                      showDays ? "text-center" : "pl-0.5",
                      (weekday === 0 || weekday === 6) && showDays && "text-muted-foreground/60",
                      time === today && "text-destructive font-semibold",
                    )}
                    style={{ width: dayWidth }}
                    title={`${weekdayLabel(time)} ${dayLabel(time)}`}
                  >
                    {showDays ? new Date(time).getUTCDate() : dayLabel(time)}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
        <div className="relative pb-2">
          {todayInRange ? (
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-10"
              style={{ left: sidebarWidth + x(today) + dayWidth / 2 }}
              aria-hidden
            >
              <span className="bg-destructive absolute inset-y-0 w-0.5 -translate-x-1/2" />
              <span className="bg-destructive text-destructive-foreground sticky top-16 -ml-6 inline-block w-12 rounded px-1 text-center text-[10px] leading-4">
                {todayLabel}
              </span>
            </div>
          ) : null}
          {content}
        </div>
      </div>
    </div>
  )
}

function GanttBlock({
  item,
  left,
  dayWidth,
  sidebarWidth,
  onSelect,
}: {
  item: GanttItem
  left: number
  dayWidth: number
  sidebarWidth: number
  onSelect: (id: string) => void
}) {
  const bar = item.shape === "bar"
  const span = ((item.end - item.start) / GANTT_DAY_MS + 1) * dayWidth
  const trigger = bar ? (
    <button
      type="button"
      aria-label={item.ariaLabel}
      onClick={() => onSelect(item.id)}
      className={cn(
        "focus-visible:ring-ring absolute top-1.5 z-10 flex h-7 min-w-3 items-center overflow-hidden rounded-md border px-1.5 text-xs font-medium outline-none focus-visible:ring-2",
        TONE[item.tone],
      )}
      style={{ left, width: Math.max(span, 12) }}
    >
      <span className="sticky truncate" style={{ left: sidebarWidth + 4 }}>{item.label}</span>
    </button>
  ) : (
    <button
      type="button"
      aria-label={item.ariaLabel}
      onClick={() => onSelect(item.id)}
      className="focus-visible:ring-ring absolute top-1.5 z-10 flex h-7 items-center gap-1 rounded-full outline-none focus-visible:ring-2"
      style={{ left: left + dayWidth / 2 - 14, minWidth: 28 }}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-xs font-bold shadow-sm",
          FLAG_TONE[item.tone],
        )}
      >
        {item.count && item.count > 1 ? item.count : "◆"}
      </span>
    </button>
  )
  return (
    <Tooltip>
      <TooltipTrigger render={trigger} />
      <TooltipContent side="top" className="flex-col items-start gap-1 py-2 text-left">
        {item.tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
