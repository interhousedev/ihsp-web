import type { ReactNode } from "react"
import { cn } from "../../lib/utils"

export type PageHeaderProps = {
  title: string
  /** A back link before the title (pass a link component; `@ihsp/ui` does not know the router). */
  back?: ReactNode
  /** Buttons next to the title; they wrap under it on phones. */
  actions?: ReactNode
  className?: string
}

/** The page title row: optional back link, the H1 and actions. No subtitle by design (copy rule). */
export function PageHeader({ title, back, actions, className }: PageHeaderProps) {
  return (
    <div data-slot="page-header" className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {back ? <div className="shrink-0">{back}</div> : null}
        <h1 className="min-w-0 text-2xl font-bold tracking-tight break-words md:text-3xl">{title}</h1>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
