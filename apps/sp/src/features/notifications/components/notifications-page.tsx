"use client"

import { NotificationCenter } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"

/** The inbox (WEB-27, UF-WEB-15): everything sent to the student, with Activity and Announcements filters. */
export function NotificationsPage() {
  const t = useT("notifications")
  return (
    <PageContainer title={t("title")}>
      <NotificationCenter />
    </PageContainer>
  )
}
