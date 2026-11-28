"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton, StateView } from "@ihsp/ui"

/** The token is unknown or the student replaced it with a new one. */
export function CardInvalid() {
  const t = useT("share.card")
  return (
    <StateView state="empty" className="border-0" title={t("invalidTitle")} description={t("invalidDescription")} />
  )
}

export function CardLoading() {
  const t = useT("share")
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t("loading")}
      className="mx-auto flex w-full max-w-md flex-col gap-3"
    >
      <Skeleton className="h-72 w-full rounded-3xl" />
    </div>
  )
}
