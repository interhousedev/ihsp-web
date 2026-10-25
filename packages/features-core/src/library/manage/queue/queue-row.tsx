"use client"

import type { ManageQueueRow } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, cn } from "@ihsp/ui"
import { IconAlertTriangle, IconFlag, IconUserOff } from "@ihsp/ui"
import { SourceTag } from "../../catalog/source-tag"

/** One selectable row of the queue: title, kind, uploader and cohort, age, scan findings, reports. */
export function QueueRowView({
  row,
  selected,
  needsAnotherLibrarian,
  onSelect,
}: {
  row: ManageQueueRow
  selected: boolean
  /** The librarian uploaded this item: the API refused their approval. */
  needsAnotherLibrarian: boolean
  onSelect: () => void
}) {
  const t = useT("library.manage.queue")
  const report = useT("library.report")
  const type = useT("library.type")
  const format = useFormatters()
  const title = row.suggestion?.title ?? row.item.title
  return (
    <button
      type="button"
      data-queue-row
      aria-current={selected ? "true" : undefined}
      onClick={onSelect}
      className={cn(
        "hover:bg-muted/60 focus-visible:ring-ring flex min-h-11 w-full flex-col gap-1.5 rounded-lg border p-3 text-start transition-colors outline-none focus-visible:ring-2",
        selected && "bg-muted border-primary",
      )}
    >
      <span className="flex flex-wrap items-center gap-1.5">
        {row.item.id ? <SourceTag source={row.item.tag.source} /> : null}
        <Badge variant="outline">{t(`kind.${row.kind}`)}</Badge>
        {row.item.id ? <span className="text-muted-foreground text-xs">{type(row.item.type)}</span> : null}
      </span>
      <span className="line-clamp-2 text-sm font-medium break-words">{title}</span>
      <span className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {row.uploader ? (
          <span>
            {row.uploader.name}
            {row.uploader.cohort ? `, ${row.uploader.cohort}` : ""}
          </span>
        ) : row.suggestion ? (
          <span>{row.suggestion.user_name}</span>
        ) : null}
        <span>{t("sent", { age: format.relative(row.submitted_at) })}</span>
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        {row.scan.findings.length > 0 ? (
          <Badge variant="destructive">
            <IconAlertTriangle aria-hidden />
            {t("findings", { count: row.scan.findings.length })}
          </Badge>
        ) : null}
        {row.reports.map((entry) => (
          <Badge key={entry.reason} variant="secondary">
            <IconFlag aria-hidden />
            {t("reportCount", { count: entry.count, reason: report(`reason.${entry.reason}`) })}
          </Badge>
        ))}
        {needsAnotherLibrarian ? (
          <Badge variant="outline">
            <IconUserOff aria-hidden />
            {t("needsOther")}
          </Badge>
        ) : null}
      </span>
    </button>
  )
}
