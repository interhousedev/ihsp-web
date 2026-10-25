"use client"

import { useT } from "@ihsp/i18n"
import { useId, type ReactNode } from "react"

/** "Suggested dates to confirm": the block at the top of the exams page, shown only while there are suggestions. */
export function SuggestionsBlock({ count, children }: { count: number; children: ReactNode }) {
  const t = useT("exams.suggestions")
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className="border-primary/40 bg-primary/5 flex flex-col gap-3 rounded-xl border p-3"
    >
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-base font-semibold">
          {t("title")} <span className="text-muted-foreground font-normal">({count})</span>
        </h2>
      </div>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}
