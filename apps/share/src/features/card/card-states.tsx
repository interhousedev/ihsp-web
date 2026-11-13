"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton, StateView } from "@ihsp/ui"

/** The token is unknown or its minute is over. */
export function CardExpired() {
  const t = useT("share.card")
  return (
    <StateView state="empty" className="border-0" title={t("expiredTitle")} description={t("expiredDescription")} />
  )
}

export function CardLoading() {
  const t = useT("share")
  return (
    <div role="status" aria-busy="true" aria-label={t("loading")} className="flex flex-col items-center gap-3">
      <Skeleton className="size-32 rounded-full" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
