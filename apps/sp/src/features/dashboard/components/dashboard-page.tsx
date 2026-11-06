"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useNow } from "../../shared/hooks/use-now"
import { Dashboard } from "../../today/dashboard/dashboard"

/** Home, the landing page (`/`): the student's widget grid (today's lessons, marks, semester, and the other widgets). */
export function DashboardPage() {
  const t = useT("dashboard")
  const f = useFormatters()
  const now = useNow(60_000)
  return (
    <PageContainer title={t("title")} meta={f.date(now, { weekday: "long", day: "numeric", month: "long" })}>
      <Dashboard />
    </PageContainer>
  )
}
