import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "../lib/utils"

export type TimelineItem = {
  id: string
  /** Time or period shown on the left (`08:30`). */
  time?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  /** Right side: badges, mark, room. */
  meta?: ReactNode
  /** past: muted; current: highlighted; cancelled: struck through. */
  state?: "past" | "current" | "upcoming" | "cancelled"
  href?: string
}

const DOT: Record<NonNullable<TimelineItem["state"]>, string> = {
  past: "bg-muted-foreground/40",
  current: "bg-primary ring-primary/30 ring-4",
  upcoming: "bg-border border-muted-foreground/40 border",
  cancelled: "bg-destructive/60",
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const state = item.state ?? "upcoming"
  const body = (
    <div
      className={cn(
        "flex min-h-11 min-w-0 flex-1 items-start justify-between gap-3 rounded-lg px-2 py-2",
        item.href && "hover:bg-accent",
        state === "current" && "bg-accent/60",
      )}
    >
      <div
        className={cn(
          "min-w-0",
          state === "past" && "text-muted-foreground",
          state === "cancelled" && "line-through opacity-70",
        )}
      >
        <div className="truncate text-sm font-medium">{item.title}</div>
        {item.subtitle ? <div className="text-muted-foreground truncate text-xs">{item.subtitle}</div> : null}
      </div>
      {item.meta ? <div className="flex shrink-0 items-center gap-2">{item.meta}</div> : null}
    </div>
  )
  return (
    <li className="flex gap-3" data-state={state} aria-current={state === "current" ? "step" : undefined}>
      <div className="text-muted-foreground w-12 shrink-0 pt-3 text-right text-xs tabular-nums">{item.time}</div>
      <div className="relative flex flex-col items-center">
        <span className={cn("mt-4 size-2.5 shrink-0 rounded-full", DOT[state])} aria-hidden />
        <span className="bg-border -mb-2 w-px flex-1" aria-hidden />
      </div>
      {item.href ? (
        <Link
          href={item.href}
          className="flex min-w-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  )
}

/** Vertical timeline (today's lessons). Items keep the given order. */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {items.map((item) => (
        <TimelineRow key={item.id} item={item} />
      ))}
    </ol>
  )
}
