import type { ReactNode } from "react"
import { cn } from "../../lib/utils"

export type PageHeaderProps = {
  title: string
  /** A back link before the title (pass a link component; `@ihsp/ui` does not know the router). */
  back?: ReactNode
  /** A status next to the title (`StatusBadge`, `Badge`). */
  badge?: ReactNode
  /** Facts about this record under the title (login, group, semester). Never a description of the page. */
  meta?: ReactNode
  /** Buttons next to the title; they wrap under it on phones. */
  actions?: ReactNode
  className?: string
}

/** The page title row: optional back link, the H1, its badge and meta line, and actions. */
export function PageHeader({ title, back, badge, meta, actions, className }: PageHeaderProps) {
  return (
    <div data-slot="page-header" className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {back ? <div className="shrink-0">{back}</div> : null}
          <h1 className="min-w-0 text-2xl font-bold tracking-tight break-words md:text-3xl">{title}</h1>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        {meta ? <div className="text-muted-foreground min-w-0 text-sm break-words">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
