"use client"

// Adapted from the personal component library (planning/gantt, Kibo UI, MIT): the same anatomy (sticky sidebar,
// month + day header, feature rows, today marker) rebuilt on plain pixels: no jotai, context menu or hard-coded
// English; every label comes from the caller. Bars flagged `editable` move and resize by pointer or keyboard.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"

import { cn } from "../lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export const GANTT_DAY_MS = 86_400_000

export type GanttTone = "primary" | "success" | "danger" | "warning" | "muted" | "info" | "accent"

export type GanttItem = {
  id: string
  /** UTC midnight of the first day. */
  start: number
  /** UTC midnight of the last day (inclusive). */
  end: number
  tone: GanttTone
  /** `bar` spans start..end; `flag` is a one-day marker. */
  shape: "bar" | "flag"
  /** Text inside a bar. */
  label: string
  /** Two or three letters printed beside a flag (the kind of the deadline). */
  short?: string
  /** More items on the same day, shown as a count on a flag. */
  count?: number
  /** Already behind us: drawn faded. */
  past?: boolean
  /** A bar that can be dragged and resized (needs `onChange`). */
  editable?: boolean
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
  info: "bg-info/20 border-info/70 text-foreground",
  accent: "bg-accent border-accent-foreground/40 text-foreground",
  muted: "bg-muted border-border text-muted-foreground",
}
const FLAG_TONE: Record<GanttTone, string> = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-white",
  danger: "bg-destructive text-destructive-foreground",
  warning: "bg-warning text-foreground",
  info: "bg-info text-white",
  accent: "bg-accent-foreground text-accent",
  muted: "bg-muted-foreground text-background",
}

const ROW_PX = 40
const HEAD_PX = 56
/** A bar never gets narrower than this many days. */
const MIN_BAR_DAYS = 3
/** Pointer travel below which a press is a click, not a drag. */
const DRAG_SLOP = 4

export type GanttRange = { start: number; end: number }

/**
 * A timeline: rows of bars and flags over a day axis inside one scroll container (both axes), a sticky sidebar and
 * header, a "today" line. Hover shows `item.tooltip`; click or Enter calls `onSelect`. Editable bars call `onChange`
 * with their new first and last day (drag the body to move, an edge to resize, arrows for a day, Shift+arrows to
 * resize); the caller persists the change and re-renders.
 */
export function Gantt({
  rows,
  groups,
  groupActions,
  groupItems,
  groupIcons,
  scrollToGroup,
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
  onChange,
  className,
}: {
  rows: GanttRow[]
  /** Group id to heading. Rows of a group missing here render without a heading. */
  groups: Record<string, string>
  /** Optional control (for example an add button) shown next to a group heading. */
  groupActions?: Record<string, ReactNode>
  /** Flags drawn on the heading row of a group; a group listed here gets a heading with a timeline. */
  groupItems?: Record<string, GanttItem[]>
  /** Small image shown before a group heading. */
  groupIcons?: Record<string, ReactNode>
  /** Scrolls this group's heading to the top once. */
  scrollToGroup?: string | null
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
  onChange?: (id: string, range: GanttRange) => void
  className?: string
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const days = Math.round((end - start) / GANTT_DAY_MS) + 1
  const width = days * dayWidth
  const x = useCallback((time: number) => ((time - start) / GANTT_DAY_MS) * dayWidth, [start, dayWidth])

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

  // Open on today (a third of the way in), again when the zoom changes. WebKit leaves sticky cells unpainted after a
  // programmatic scroll until the next real one, so nudge once on the next frame.
  useLayoutEffect(() => {
    const node = scroller.current
    if (!node) return
    const target = x(today) - (node.clientWidth - sidebarWidth) / 3
    node.scrollLeft = Math.max(0, target)
    const frame = requestAnimationFrame(() => {
      const left = node.scrollLeft
      node.scrollLeft = left + 1
      node.scrollLeft = left
    })
    return () => cancelAnimationFrame(frame)
  }, [x, today, sidebarWidth])

  useEffect(() => {
    const node = scroller.current
    if (!node || !scrollToGroup) return
    const heading = node.querySelector<HTMLElement>(`[data-group="${CSS.escape(scrollToGroup)}"]`)
    // The heading's offset is measured inside the body, which starts right under the sticky header.
    if (heading) node.scrollTop = heading.offsetTop
  }, [scrollToGroup, rows.length])

  const showDays = dayWidth >= 18
  const gridStep = dayWidth >= 18 ? dayWidth : dayWidth * 7
  const grid: CSSProperties = {
    backgroundImage: "linear-gradient(to right, var(--color-border) 1px, transparent 1px)",
    backgroundSize: `${gridStep}px 100%`,
    backgroundPosition:
      dayWidth >= 18 ? "0 0" : `${((7 - ((new Date(start).getUTCDay() + 6) % 7)) % 7) * dayWidth}px 0`,
    opacity: 0.6,
  }
  const todayInRange = today >= start && today <= end
  const content: ReactNode[] = []
  let lastGroup: string | null = null
  // Items that end before the first day of the chart have no place on it.
  const block = (item: GanttItem) =>
    item.end < start ? null : (
      <GanttBlock
        key={item.id}
        item={item}
        left={x(item.start)}
        dayWidth={dayWidth}
        sidebarWidth={sidebarWidth}
        onSelect={onSelect}
        onChange={onChange}
      />
    )
  for (const row of rows) {
    if (row.group !== lastGroup && groups[row.group]) {
      const flags = groupItems?.[row.group]
      content.push(
        flags ? (
          <div
            key={`g:${row.group}`}
            data-group={row.group}
            className="bg-muted relative flex h-10"
            style={{ width: sidebarWidth + width }}
          >
            <div
              className="bg-muted text-foreground sticky left-0 z-20 flex shrink-0 items-center gap-1.5 border-r px-2 text-xs"
              style={{ width: sidebarWidth }}
            >
              {groupIcons?.[row.group]}
              <span className="min-w-0 flex-1 truncate font-semibold" title={groups[row.group]}>
                {groups[row.group]}
              </span>
              {groupActions?.[row.group]}
            </div>
            <div className="relative shrink-0" style={{ width }}>
              <div className="pointer-events-none absolute inset-0" style={grid} aria-hidden />
              {flags.map(block)}
            </div>
          </div>
        ) : (
          <div
            key={`g:${row.group}`}
            data-group={row.group}
            className="bg-muted relative flex h-10"
            style={{ width: sidebarWidth + width }}
          >
            <div
              className="bg-muted text-muted-foreground sticky left-0 z-20 flex items-center px-3 text-xs"
              style={{ width: sidebarWidth + width }}
            >
              <span className="sticky left-3 flex max-w-[calc(100vw-4rem)] flex-wrap items-center gap-x-1 normal-case">
                <span className="font-semibold tracking-wide uppercase">{groups[row.group]}</span>
                {groupActions?.[row.group]}
              </span>
            </div>
          </div>
        ),
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
          {row.items.map(block)}
        </div>
      </div>,
    )
  }

  return (
    <div
      ref={scroller}
      role="region"
      aria-label={ariaLabel}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be focusable to scroll by keyboard
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
                    )}
                    style={{ width: dayWidth }}
                    title={`${weekdayLabel(time)} ${dayLabel(time)}`}
                  >
                    {showDays ? new Date(time).getUTCDate() : dayLabel(time)}
                  </span>
                )
              })}
            </div>
            {todayInRange ? (
              <span
                className="bg-destructive text-destructive-foreground absolute top-7 z-10 -translate-x-1/2 rounded px-1.5 text-[10px] leading-5 font-semibold whitespace-nowrap"
                style={{ left: x(today) + dayWidth / 2 }}
              >
                {todayLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div className="relative pb-2">
          {todayInRange ? (
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-0"
              style={{ left: sidebarWidth + x(today) + dayWidth / 2 }}
              aria-hidden
            >
              <span className="bg-destructive absolute inset-y-0 w-0.5 -translate-x-1/2" />
            </div>
          ) : null}
          {content}
        </div>
      </div>
    </div>
  )
}

type DragMode = "move" | "start" | "end"

function GanttBlock({
  item,
  left,
  dayWidth,
  sidebarWidth,
  onSelect,
  onChange,
}: {
  item: GanttItem
  left: number
  dayWidth: number
  sidebarWidth: number
  onSelect: (id: string) => void
  onChange?: (id: string, range: GanttRange) => void
}) {
  const bar = item.shape === "bar"
  const editable = bar && item.editable === true && onChange !== undefined
  // Live drag state: which part is held and how many whole days it moved.
  const [drag, setDrag] = useState<{ mode: DragMode; days: number } | null>(null)
  const press = useRef<{ mode: DragMode; x: number; moved: boolean } | null>(null)
  const justDragged = useRef(false)

  const shifted = (mode: DragMode, days: number): GanttRange => {
    const day = GANTT_DAY_MS
    if (mode === "move") return { start: item.start + days * day, end: item.end + days * day }
    if (mode === "end") return { start: item.start, end: Math.max(item.start, item.end + days * day) }
    return { start: Math.min(item.end, item.start + days * day), end: item.end }
  }
  const live = drag ? shifted(drag.mode, drag.days) : { start: item.start, end: item.end }
  const barLeft = left + ((live.start - item.start) / GANTT_DAY_MS) * dayWidth
  const span = ((live.end - live.start) / GANTT_DAY_MS + 1) * dayWidth
  const barWidth = Math.max(span, MIN_BAR_DAYS * dayWidth, 12)
  // Roughly 6.5px a character plus padding; a longer label is printed after the bar instead of being cut.
  const labelFits = item.label.length * 6.5 + 16 <= barWidth

  function begin(mode: DragMode) {
    return (event: PointerEvent<HTMLElement>) => {
      if (!editable || event.button !== 0) return
      if (mode !== "move") event.stopPropagation()
      event.currentTarget.setPointerCapture(event.pointerId)
      press.current = { mode, x: event.clientX, moved: false }
    }
  }
  function track(event: PointerEvent<HTMLElement>) {
    const current = press.current
    if (!current) return
    const dx = event.clientX - current.x
    if (!current.moved && Math.abs(dx) < DRAG_SLOP) return
    current.moved = true
    setDrag({ mode: current.mode, days: Math.round(dx / dayWidth) })
  }
  function finish(event: PointerEvent<HTMLElement>) {
    const current = press.current
    press.current = null
    if (!current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    if (!current.moved) return
    justDragged.current = true
    setTimeout(() => (justDragged.current = false), 0)
    const days = Math.round((event.clientX - current.x) / dayWidth)
    setDrag(null)
    if (days !== 0 && event.type === "pointerup") onChange?.(item.id, shifted(current.mode, days))
  }
  function keys(event: KeyboardEvent<HTMLElement>) {
    if (!editable || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return
    event.preventDefault()
    onChange?.(item.id, shifted(event.shiftKey ? "end" : "move", event.key === "ArrowLeft" ? -1 : 1))
  }

  const handle = (mode: "start" | "end") => (
    <span
      aria-hidden
      onPointerDown={begin(mode)}
      onPointerMove={track}
      onPointerUp={finish}
      onPointerCancel={finish}
      className={cn(
        "hover:bg-foreground/15 absolute inset-y-1.5 z-20 w-2 cursor-ew-resize touch-pan-y rounded-sm",
        mode === "start" ? "left-0" : "right-0",
      )}
    />
  )

  const trigger = bar ? (
    <div
      className="absolute top-1.5 z-10 h-7"
      style={{ left: barLeft, width: barWidth, transition: drag ? undefined : "left 120ms, width 120ms" }}
    >
      <button
        type="button"
        aria-label={item.ariaLabel}
        onClick={(event) => {
          if (justDragged.current) event.preventDefault()
          else onSelect(item.id)
        }}
        onPointerDown={begin("move")}
        onPointerMove={track}
        onPointerUp={finish}
        onPointerCancel={finish}
        onKeyDown={keys}
        className={cn(
          "focus-visible:ring-ring flex size-full items-center overflow-hidden rounded-md border px-1.5 text-xs font-medium outline-none focus-visible:ring-2",
          editable && "cursor-grab touch-pan-y active:cursor-grabbing",
          drag && "shadow-md",
          item.past && "opacity-60",
          TONE[item.tone],
        )}
      >
        {labelFits ? (
          <span className="sticky truncate" style={{ left: sidebarWidth + 4 }}>
            {item.label}
          </span>
        ) : null}
      </button>
      {editable ? handle("start") : null}
      {editable ? handle("end") : null}
      {labelFits ? null : (
        <span className="text-foreground pointer-events-none absolute top-0 left-full ml-1.5 flex h-7 items-center text-xs font-medium whitespace-nowrap">
          {item.label}
        </span>
      )}
    </div>
  ) : (
    <button
      type="button"
      aria-label={item.ariaLabel}
      onClick={() => onSelect(item.id)}
      className={cn(
        "focus-visible:ring-ring absolute top-1.5 z-10 flex h-7 items-center gap-1 rounded-full outline-none focus-visible:ring-2",
        item.past && "opacity-50 grayscale",
      )}
      style={{ left: left + dayWidth / 2 - 14, minWidth: 28 }}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm",
          FLAG_TONE[item.tone],
        )}
      >
        {item.count && item.count > 1 ? item.count : "◆"}
      </span>
      {item.short ? (
        <span className="text-foreground pr-1 text-[10px] leading-none font-semibold tracking-wide whitespace-nowrap">
          {item.short}
        </span>
      ) : null}
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
