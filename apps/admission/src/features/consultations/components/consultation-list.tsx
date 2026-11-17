"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton, StateView } from "@ihsp/ui"
import type { Consultation } from "../api"
import { QueryError } from "../../shell/components/query-error"
import { ConsultationCard } from "./consultation-card"

/** Loading, error, empty and success states of a list of consultations. */
export function ConsultationList({
  items,
  isPending,
  error,
  onRetry,
  emptyKey,
}: {
  items: Consultation[] | undefined
  isPending: boolean
  error: unknown
  onRetry: () => void
  emptyKey: string
}) {
  const t = useT("consultations")
  if (isPending) return <Skeleton className="h-24 w-full" />
  if (error) return <QueryError error={error} onRetry={onRetry} />
  if (!items || items.length === 0) return <StateView state="empty" title={t(emptyKey)} />
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <ConsultationCard key={item.id} item={item} />
      ))}
    </ul>
  )
}
