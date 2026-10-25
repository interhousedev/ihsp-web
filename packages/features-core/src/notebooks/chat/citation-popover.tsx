"use client"

import type { Citation } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { SourceKindIcon } from "../lib/source-icons"

/** The hover card of a citation chip: source, page and the quoted passage. */
export function CitationPopover({ citation, removed }: { citation: Citation; removed?: boolean }) {
  const t = useT("notebooks")
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-1.5 text-xs font-medium">
        <SourceKindIcon kind={citation.source_kind} title={citation.source_title} className="size-4" />
        <span className="min-w-0 truncate">{citation.source_title}</span>
        {citation.page !== null ? (
          <span className="text-muted-foreground shrink-0 font-normal">
            {t("viewer.page", { page: citation.page })}
          </span>
        ) : null}
      </p>
      <blockquote className="border-primary/40 border-s-2 ps-2 text-sm break-words">{citation.snippet}</blockquote>
      <p className="text-muted-foreground text-xs">{removed ? t("citation.removed") : t("citation.open")}</p>
    </div>
  )
}
