import { cn } from "@ihsp/ui"
import type { ReactNode } from "react"

/** A titled block with an optional one-line hint, used by the examples panel. */
export function Section({ title, hint, children, className }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </div>
      {children}
    </section>
  )
}
