"use client"

import { useT } from "@ihsp/i18n"
import { AccessDenied, isForbidden } from "../shell/components/access-denied"
import { useReadiness } from "./api"
import { ReadinessRing } from "./readiness-ring"

/** Readiness of one student, for the staff detail header. Renders nothing until it loads; a 403 shows that the student has not shared it. */
export function StudentReadiness({ studentId }: { studentId: string }) {
  const t = useT("home.readiness")
  const readiness = useReadiness(studentId)
  if (readiness.isError && isForbidden(readiness.error)) return <AccessDenied section="readiness" compact />
  if (!readiness.data) return null
  return (
    <div className="flex items-center gap-3">
      <ReadinessRing percent={readiness.data.percent} size={64} />
      <p className="text-sm font-medium">{t("title")}</p>
    </div>
  )
}
