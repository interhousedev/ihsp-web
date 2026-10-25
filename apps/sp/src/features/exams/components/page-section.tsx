"use client"

import { useId, type ReactNode } from "react"

/** A titled section of the preparation page (a `<section>` named by its heading). */
export function PageSection({
  title,
  hint,
  action,
  children,
}: {
  title: string
  hint?: string
  action?: ReactNode
  children: ReactNode
}) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
