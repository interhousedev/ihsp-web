"use client"

import type { ManageQueueRow } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, buttonVariants } from "@ihsp/ui"
import { IconFlagCheck } from "@tabler/icons-react"
import Link from "next/link"
import { SourceTag } from "../../catalog/source-tag"
import { itemHref, manageQueueHref } from "../../utils/hrefs"

/** One reported item: title, uploader, the reasons with counts, the age, and **Resolve** (or a link to the queue). */
export function ReportRow({ row, held, onResolve }: { row: ManageQueueRow; held: boolean; onResolve: () => void }) {
  const t = useT("library.manage.reports")
  const report = useT("library.report")
  const format = useFormatters()
  const canResolve = (row.report_ids ?? []).length > 0
  return (
    <li className="flex flex-col gap-2 rounded-xl border p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <SourceTag source={row.item.tag.source} />
          {held ? <Badge variant="secondary">{t("heldBadge")}</Badge> : null}
        </div>
        {row.item.id ? (
          <Link href={itemHref(row.item.id)} className="font-medium break-words hover:underline">
            {row.item.title}
          </Link>
        ) : (
          <span className="font-medium break-words">{row.item.title}</span>
        )}
        <p className="text-muted-foreground text-xs">
          {row.uploader ? `${row.uploader.name}${row.uploader.cohort ? `, ${row.uploader.cohort}` : ""} · ` : ""}
          {t("sent", { age: format.relative(row.submitted_at) })}
        </p>
        <ul className="flex flex-wrap gap-1.5" aria-label={t("reasons")}>
          {row.reports.map((entry) => (
            <li key={entry.reason}>
              <Badge variant="outline">
                {t("reasonCount", { count: entry.count, reason: report(`reason.${entry.reason}`) })}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
      {canResolve ? (
        <Button type="button" className="min-h-11 shrink-0 md:min-h-8" onClick={onResolve}>
          <IconFlagCheck aria-hidden />
          {t("resolve")}
          <span className="sr-only">: {row.item.title}</span>
        </Button>
      ) : (
        <Link
          href={manageQueueHref("held")}
          className={buttonVariants({ variant: "outline", className: "min-h-11 shrink-0 md:min-h-8" })}
        >
          {t("openQueue")}
        </Link>
      )}
    </li>
  )
}
