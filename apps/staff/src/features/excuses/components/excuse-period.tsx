"use client"

import type { Excuse } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"

/** `21 Sep – 23 Sep`, or `21 Sep – until further notice` for an open-ended excuse. */
export function ExcusePeriod({ excuse }: { excuse: Pick<Excuse, "starts_on" | "ends_on"> }) {
  const t = useT("excuses")
  const f = useFormatters()
  const from = f.date(excuse.starts_on)
  return <>{excuse.ends_on ? t("period", { from, to: f.date(excuse.ends_on) }) : t("openEnded", { from })}</>
}
