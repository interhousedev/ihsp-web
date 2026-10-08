"use client"

import { NotificationCenter } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"

/** The inbox: lesson prompts, announcements and system messages, with Activity and Announcements filters. */
export function NotificationsPage() {
  const t = useT("notifications")
  return (
    <PageContainer title={t("title")} description={t("description")}>
      <NotificationCenter />
    </PageContainer>
  )
}
