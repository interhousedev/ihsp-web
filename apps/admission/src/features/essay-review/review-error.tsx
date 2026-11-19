"use client"

import { isApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"

/** A failed run: a spent weekly limit (base or per-university) says so, anything else shows the problem title. */
export function ReviewError({ error }: { error: unknown }) {
  const t = useT("essayReview")
  const errorMessage = useErrorMessage()
  if (!error) return null
  const quota = isApiError(error) && (error.status === 429 || error.type.includes("quota"))
  return (
    <p role="alert" className="text-destructive text-sm">
      {quota ? t("quota") : errorMessage(error)}
    </p>
  )
}
