"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { Dashboard } from "../dashboard/dashboard"
import { useNow } from "../../shared/hooks/use-now"

/** Today (WEB-3, UF-WEB-01, UF-WEB-02): nothing but the widget dashboard; every former section is a widget kind. */
export function TodayPage() {
  const t = useT("today")
  const f = useFormatters()
  const now = useNow(60_000)

  return (
    <PageContainer
      title={t("title")}
      description={f.date(now, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
    >
      <Dashboard />
    </PageContainer>
  )
}
