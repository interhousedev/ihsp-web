import { cn, Icons } from "@ihsp/ui"
import type { ComponentType, ReactNode } from "react"

/**
 * One self-discovery tool (the career test, the ikigai) as a card: what it is, what it gives, where the student
 * stands, and the one button that opens it. Every such tool uses this card, so they read as steps of one kind.
 */
export function ToolCard({
  icon: Icon,
  step,
  title,
  hint,
  status,
  done,
  action,
  className,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  /** The place of the tool in the suggested order, shown as a number. */
  step: number
  title: string
  hint: string
  status: string
  done: boolean
  action: ReactNode
  className?: string
}) {
  return (
    <article className={cn("bg-card rounded-card flex min-w-0 flex-col gap-3 border p-3.5 md:p-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            done ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
          )}
        >
          {done ? <Icons.check aria-hidden className="size-4" /> : <Icon aria-hidden className="size-4" />}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-sm leading-tight font-semibold">
            <span className="text-muted-foreground tabular-nums">{step}. </span>
            {title}
          </h2>
          <p className="text-muted-foreground text-xs leading-snug">{hint}</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <span className={cn("text-xs font-medium", done ? "text-primary" : "text-muted-foreground")}>{status}</span>
        {action}
      </div>
    </article>
  )
}
