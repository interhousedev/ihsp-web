"use client"

import type { Excuse } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"

/** The period of an excuse: "7 Oct – 9 Oct", one day, or "from 7 Oct" for an open-ended excuse. */
export function ExcuseDates({ excuse }: { excuse: Pick<Excuse, "starts_on" | "ends_on"> }) {
  const t = useT("excuses")
  const f = useFormatters()
  const opts = { day: "numeric", month: "short", year: "numeric" } as const
  const from = f.date(excuse.starts_on, opts)
  if (!excuse.ends_on) return <>{t("dates.from", { date: from })}</>
  if (excuse.ends_on === excuse.starts_on) return <>{from}</>
  return <>{t("dates.range", { from, to: f.date(excuse.ends_on, opts) })}</>
}
