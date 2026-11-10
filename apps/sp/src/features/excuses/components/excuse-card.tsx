"use client"

import type { Excuse } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import Link from "next/link"
import { isKnownOrigin, templateTitle } from "../utils/excuse-labels"
import { ExcuseDates } from "./excuse-dates"
import { ExcuseStatusBadge } from "./excuse-status-badge"

/** One excuse of the list; the whole card opens its detail. */
export function ExcuseCard({ excuse }: { excuse: Excuse }) {
  const t = useT("excuses")
  const locale = useLocale()
  const title = templateTitle(excuse.template, locale) || t("untitled")
  return (
    <Link
      href={`/excuses/view/?id=${encodeURIComponent(excuse.id)}`}
      className="bg-card hover:bg-muted flex min-h-11 flex-col gap-2 rounded-card border p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 flex-1 text-base font-medium break-words">{title}</h2>
        <ExcuseStatusBadge status={excuse.status} />
      </div>
      <p className="text-muted-foreground text-sm tabular-nums">
        <ExcuseDates excuse={excuse} />
      </p>
      {excuse.origin !== "request" && isKnownOrigin(excuse.origin) ? (
        <p className="text-muted-foreground text-xs">{t(`origin.${excuse.origin}`)}</p>
      ) : null}
      {excuse.reason ? <p className="line-clamp-2 text-sm break-words">{excuse.reason}</p> : null}
    </Link>
  )
}
