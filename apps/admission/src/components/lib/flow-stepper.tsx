"use client"

import { cn, Icons } from "@ihsp/ui"
import type { ReactNode } from "react"

export type FlowStepperItem = {
  id: string
  number: number
  title: string
  /** One muted line under the title: what is done, or why the step is closed. */
  summary?: ReactNode
  status: "done" | "current" | "locked"
  /** Words of the status chip (for example "Done"). */
  statusLabel: string
  open: boolean
  /** Shown only while the step is open. */
  content?: ReactNode
  /** The way on to the next step, under the content. */
  footer?: ReactNode
}

function Node({ item, className }: { item: FlowStepperItem; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
        item.status === "done" && "border-success bg-success text-white",
        item.status === "current" && "border-primary bg-primary text-primary-foreground",
        item.status === "locked" && "border-hairline-strong bg-muted text-muted-foreground",
        className,
      )}
    >
      {item.status === "done" ? (
        <Icons.check className="size-4" />
      ) : item.status === "locked" ? (
        <Icons.lock className="size-4" />
      ) : (
        item.number
      )}
    </span>
  )
}

/**
 * A vertical stepper: one card per step on a rail of numbered nodes. Only one step is open at a time; a locked step
 * cannot be opened and says what it waits for. The page decides the state, this draws it.
 */
export function FlowStepper({
  items,
  label,
  onSelect,
}: {
  items: readonly FlowStepperItem[]
  label: string
  onSelect: (id: string) => void
}) {
  return (
    <ol aria-label={label} className="flex min-w-0 flex-col">
      {items.map((item, index) => {
        const panel = `flow-step-${item.id}`
        return (
          <li
            key={item.id}
            data-testid={`flow-step-${item.id}`}
            data-status={item.status}
            aria-current={item.status === "current" ? "step" : undefined}
            className="relative min-w-0 pb-2 md:pb-3 md:pl-14"
          >
            {index < items.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute top-11 bottom-0 left-[1.0625rem] hidden w-0.5 md:block",
                  item.status === "done" ? "bg-success/60" : "bg-border",
                )}
              />
            ) : null}
            <Node item={item} className="absolute top-1 left-0 hidden md:flex" />
            <div
              className={cn(
                "bg-card rounded-card min-w-0 border",
                item.status === "locked" && "bg-muted/40 border-dashed",
                item.open && "border-primary/40 shadow-sm",
              )}
            >
              <button
                type="button"
                id={`${panel}-header`}
                aria-expanded={item.open}
                aria-controls={panel}
                aria-disabled={item.status === "locked"}
                onClick={() => item.status !== "locked" && onSelect(item.id)}
                className={cn(
                  "focus-visible:ring-ring rounded-card flex min-h-12 w-full min-w-0 items-center gap-3 p-2.5 text-left focus-visible:ring-2 focus-visible:outline-none md:min-h-11 md:px-4 md:py-1.5",
                  item.status === "locked" ? "cursor-not-allowed" : "hover:bg-accent/40",
                )}
              >
                <Node item={item} className="md:hidden" />
                <span className="min-w-0 flex-1 md:flex md:items-baseline md:gap-3">
                  <span
                    className={cn(
                      "block text-base font-semibold md:shrink-0",
                      item.status === "locked" && "text-muted-foreground",
                    )}
                  >
                    {item.title}
                  </span>
                  {item.summary ? (
                    <span
                      className={cn(
                        "text-muted-foreground mt-0.5 min-w-0 text-sm md:mt-0 md:block md:truncate",
                        item.open ? "block" : "hidden",
                      )}
                    >
                      {item.summary}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
                    item.status === "done" && "bg-success-muted text-success",
                    item.status === "current" && "bg-primary/10 text-primary",
                    item.status === "locked" && "bg-muted text-muted-foreground",
                  )}
                >
                  {item.statusLabel}
                </span>
                {item.status !== "locked" ? (
                  <Icons.chevronDown
                    aria-hidden
                    className={cn("text-muted-foreground size-4 shrink-0 transition-transform", item.open && "rotate-180")}
                  />
                ) : null}
              </button>
              {item.open ? (
                <div id={panel} role="region" aria-labelledby={`${panel}-header`} className="flex min-w-0 flex-col gap-3 border-t p-3 md:p-4">
                  {item.content}
                  {item.footer}
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
