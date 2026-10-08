import type { ReactNode } from "react"
import { cn } from "../../lib/utils"

export type PageContainerProps = {
  title: string
  description?: string
  /** Buttons next to the title; they wrap under it on phones. */
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/** Standard page body: title row, optional description and the content with mobile-first paddings. */
export function PageContainer({ title, description, actions, className, children }: PageContainerProps) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-4 px-4 pt-2 pb-6 md:px-6 md:pt-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight break-words md:text-3xl">{title}</h1>
          {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}
