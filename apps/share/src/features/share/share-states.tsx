"use client"

import { useT } from "@ihsp/i18n"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle, Skeleton } from "@ihsp/ui"

/** `404`: no such slug (or a path without one). */
export function ShareNotFound() {
  const t = useT("share.notFound")
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{t("title")}</EmptyTitle>
        <EmptyDescription>{t("description")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/** `410`: the owner revoked the link (or the chat or set was deleted). */
export function ShareGone({ title, description }: { title?: string; description?: string } = {}) {
  const t = useT("share.gone")
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{title ?? t("title")}</EmptyTitle>
        <EmptyDescription>{description ?? t("description")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
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
