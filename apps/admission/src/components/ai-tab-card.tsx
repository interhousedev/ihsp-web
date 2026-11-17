import { cn } from "@ihsp/ui"
import type { ComponentProps, ReactNode } from "react"

/**
 * The wrapper of every AI, insight or generated block: a small filled accent tab with the descriptor hangs inside the
 * top edge of the card, and the card carries an accent border so the block reads as machine-made at a glance.
 */
export function AiTabCard({
  label,
  icon,
  className,
  children,
  ...rest
}: { label: string; icon?: ReactNode; children: ReactNode } & ComponentProps<"div">) {
  return (
    <div
      {...rest}
      className={cn(
        "bg-card border-primary/60 rounded-card relative flex min-w-0 flex-col gap-3 border p-4 pt-10 shadow-xs",
        className,
      )}
    >
      <span className="bg-primary text-primary-foreground absolute top-0 left-4 inline-flex h-6 max-w-[calc(100%-2rem)] items-center gap-1.5 rounded-b-md px-2.5 text-xs font-semibold">
        {icon ? <span className="inline-flex shrink-0 [&_svg]:size-3.5">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </span>
      {children}
    </div>
  )
}
