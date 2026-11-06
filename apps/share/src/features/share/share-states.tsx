"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton, StateView } from "@ihsp/ui"

/** `404`: no such slug (or a path without one). */
export function ShareNotFound() {
  const t = useT("share.notFound")
  return <StateView state="empty" className="border-0" title={t("title")} description={t("description")} />
}

/** `410`: the owner revoked the link (or the chat or set was deleted). */
export function ShareGone({ title, description }: { title?: string; description?: string } = {}) {
  const t = useT("share.gone")
  return (
    <StateView
      state="empty"
      className="border-0"
      title={title ?? t("title")}
      description={description ?? t("description")}
    />
  )
}

export function ShareLoading() {
  const t = useT("share")
  return (
    <div role="status" aria-busy="true" aria-label={t("loading")} className="flex flex-col gap-3">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
