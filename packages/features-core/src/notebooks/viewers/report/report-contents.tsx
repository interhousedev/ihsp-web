"use client"

import type { ReportContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, cn } from "@ihsp/ui"
import { IconChevronDown } from "@ihsp/ui"
import { useState } from "react"
import { anchorId, scrollToHeading } from "./heading-anchors"

type ReportContentsProps = {
  headings: ReportContent["headings"]
  /** Prefix of the heading ids (see `useHeadingAnchors`). */
  prefix: string
  /** A collapsible list at the top (phones, narrow panes) instead of the sticky column. */
  collapsible: boolean
}

/** The table of contents of a report: anchor links to its headings. */
export function ReportContents({ headings, prefix, collapsible }: ReportContentsProps) {
  const t = useT("notebooks")
  const [open, setOpen] = useState(false)
  const first = Math.min(...headings.map((heading) => heading.level))

  const list = (
    <nav aria-label={t("report.contents")}>
      <ol className="flex flex-col">
        {headings.map((heading) => {
          const id = anchorId(prefix, heading.id)
          return (
            <li key={heading.id} style={{ paddingInlineStart: `${Math.max(0, heading.level - first) * 0.75}rem` }}>
              <a
                href={`#${id}`}
                className={cn(
                  "text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center rounded text-sm outline-hidden hover:underline focus-visible:ring-2",
                  collapsible ? "min-h-11" : "py-1",
                )}
                onClick={(event) => {
                  event.preventDefault()
                  scrollToHeading(id)
                  setOpen(false)
                }}
              >
                {heading.text}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )

  if (collapsible) {
    return (
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border print:hidden">
        <CollapsibleTrigger
          render={<Button type="button" variant="ghost" className="min-h-11 w-full justify-between px-3" />}
        >
          {t("report.contents")}
          <IconChevronDown aria-hidden className={cn("size-4 transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-2">{list}</CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <aside className="sticky top-4 max-h-[calc(100dvh-8rem)] w-48 shrink-0 self-start overflow-y-auto print:hidden lg:w-56">
      <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        {t("report.contents")}
      </h3>
      {list}
    </aside>
  )
}
