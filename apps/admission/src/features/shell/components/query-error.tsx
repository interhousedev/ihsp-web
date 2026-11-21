"use client"

import { ApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons, StateView } from "@ihsp/ui"
import { AccessDenied, type DeniedSection } from "./access-denied"

/** The error state of a query: a 403 is "no access" (the account lacks the permission), anything else offers a retry. */
export function QueryError({
  error,
  onRetry,
  section,
}: {
  error: unknown
  onRetry: () => void
  /** A student's section: a 403 then reads "the student has not shared it". */
  section?: DeniedSection
}) {
  const t = useT()
  if (section && error instanceof ApiError && error.status === 403) return <AccessDenied section={section} />
  if (error instanceof ApiError && error.status === 404) {
    return (
      <StateView
        state="empty"
        icon={<Icons.lock aria-hidden />}
        title={t("staff.student.notFoundTitle")}
        description={t("staff.student.notFoundText")}
      />
    )
  }
  if (error instanceof ApiError && error.status === 403) {
    return (
      <StateView
        state="empty"
        icon={<Icons.lock aria-hidden />}
        title={t("auth.forbiddenTitle")}
        description={t("auth.forbiddenDescription")}
      />
    )
  }
  return <StateView state="error" error={error} onRetry={onRetry} />
}
