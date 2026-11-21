"use client"

import { ApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons, Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import { useStudentReviews } from "../api"
import { AccessDenied } from "../../shell/components/access-denied"
import { History, ReviewView } from "./app-review-page"

/** Staff, read-only: the student's reviews built only from material shared with staff. */
export function StaffReviewTab({ studentId }: { studentId: string }) {
  const t = useT("appReview")
  const query = useStudentReviews(studentId)
  const [selected, setSelected] = useState<string | null>(null)

  if (query.isPending) return <Skeleton className="h-40 w-full" />
  if (query.isError) {
    const status = query.error instanceof ApiError ? query.error.status : 0
    if (status === 403) return <AccessDenied section="review" />
    if (status === 404) return <StateView state="empty" icon={<Icons.lock aria-hidden />} title={t("staffNoAccess")} />
    return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  }
  const items = query.data
  const current = items.find((r) => r.id === selected) ?? items[0]
  if (!current) return <StateView state="empty" title={t("staffEmpty")} />
  return (
    <div className="flex flex-col gap-6">
      <ReviewView review={current} />
      <History items={items} current={current} onSelect={setSelected} />
    </div>
  )
}
