"use client"

import type { Excuse } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { templateTitle } from "../utils/excuse-labels"
import { ExcusePeriod } from "./excuse-period"
import { ExcuseStatusBadge } from "./excuse-status-badge"

/** A list row that is a card on every width: the student, type, period and status; it opens the detail. */
export function ExcuseCard({ excuse, onOpen }: { excuse: Excuse; onOpen: () => void }) {
  const t = useT("excuses")
  const locale = useLocale()
  return (
    <li>
      <button
        type="button"
        aria-label={t("open", { name: excuse.student_name })}
        onClick={onOpen}
        className="flex min-h-11 w-full flex-col gap-1 rounded-lg border p-3 text-left hover:bg-muted/50 md:min-h-8"
      >
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">{excuse.student_name}</span>
          <ExcuseStatusBadge status={excuse.status} />
        </span>
        <span className="text-sm text-muted-foreground">
          {templateTitle(excuse.template, locale)} · <ExcusePeriod excuse={excuse} />
          {excuse.lesson_ids.length > 0 ? ` · ${t("lessonsCount", { count: excuse.lesson_ids.length })}` : ""}
        </span>
        {excuse.origin !== "request" ? <span className="text-xs text-muted-foreground">{t("origin")}</span> : null}
      </button>
    </li>
  )
}
