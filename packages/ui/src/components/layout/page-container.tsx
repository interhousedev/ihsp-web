import type { ReactNode } from "react"
import { cn } from "../../lib/utils"
import { PageHeader } from "./page-header"

/**
 * `full` (default) fills the content area: data, grids, tables, calendars, dashboards.
 * `narrow` caps a reading column or a form at `max-w-2xl`, centred.
 */
export type PageWidth = "full" | "narrow"

const WIDTH_CLASS: Record<PageWidth, string> = {
  full: "w-full",
  narrow: "mx-auto w-full max-w-2xl",
}

export type PageContainerProps = {
  title: string
  /** Content width; `full` unless the page is text to read or a form. */
  width?: PageWidth
  /** A back link before the title. */
  back?: ReactNode
  /** A status next to the title. */
  badge?: ReactNode
  /** Facts about this record under the title. */
  meta?: ReactNode
  /** Buttons next to the title; they wrap under it on phones. */
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/** Standard page body: the `PageHeader` and the content with mobile-first paddings. */
export function PageContainer({
  title,
  width = "full",
  back,
  badge,
  meta,
  actions,
  className,
  children,
}: PageContainerProps) {
  return (
    <div
      data-shell-flush
      className={cn("flex min-w-0 flex-1 flex-col gap-4 px-4 pt-3 pb-6 md:px-6 md:pt-7", WIDTH_CLASS[width], className)}
    >
      <div className="md:pe-(--shell-controls-width)">
        <PageHeader title={title} back={back} badge={badge} meta={meta} actions={actions} />
      </div>
      {children}
    </div>
  )
}
