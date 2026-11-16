"use client"

import type { ReactNode } from "react"
import { cn } from "../lib/utils"
import { Icons } from "./icons"

export type StepStatus = "complete" | "current" | "upcoming"

export type StepperItem = {
  id: string
  label: ReactNode
  /** Short second line (for example "3 of 5 filled"). */
  hint?: ReactNode
  /** Defaults to the position relative to `current`. */
  status?: StepStatus
  disabled?: boolean
}

/**
 * The steps of a process as a vertical or horizontal list. A step is complete (check mark), current (filled number) or
 * upcoming (outline number); the state is also in `aria-current` and the text, never in colour alone.
 */
export function Stepper({
  items,
  current,
  onSelect,
  orientation = "vertical",
  label,
  className,
}: {
  items: StepperItem[]
  /** `id` of the current step. */
  current: string
  /** Makes the steps buttons. */
  onSelect?: (id: string) => void
  orientation?: "vertical" | "horizontal"
  /** Accessible name of the list. */
  label: string
  className?: string
}) {
  const currentIndex = items.findIndex((item) => item.id === current)
  return (
    <nav aria-label={label} className={className}>
      <ol
        className={cn("flex gap-2", orientation === "vertical" ? "flex-col" : "flex-row items-start overflow-x-auto")}
      >
        {items.map((item, index) => {
          const status =
            item.status ?? (index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming")
          const body = (
            <>
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                  status === "complete" && "border-transparent bg-success text-primary-foreground",
                  status === "current" && "border-transparent bg-primary text-primary-foreground",
                  status === "upcoming" && "border-hairline-strong text-muted-foreground",
                )}
              >
                {status === "complete" ? <Icons.check className="size-4" /> : index + 1}
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className={cn("truncate text-sm font-medium", status === "upcoming" && "text-muted-foreground")}>
                  {item.label}
                </span>
                {item.hint ? <span className="text-muted-foreground truncate text-xs">{item.hint}</span> : null}
              </span>
            </>
          )
          const classes = "flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 md:min-h-9"
          return (
            <li key={item.id}>
              {onSelect ? (
                <button
                  type="button"
                  disabled={item.disabled}
                  aria-current={status === "current" ? "step" : undefined}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    classes,
                    "hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 w-full cursor-pointer",
                  )}
                >
                  {body}
                </button>
              ) : (
                <div aria-current={status === "current" ? "step" : undefined} className={classes}>
                  {body}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
