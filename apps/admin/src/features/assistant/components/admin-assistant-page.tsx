"use client"

import { AssistantChat } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"

/** The Administration assistant (ADM-15, AI-6, UF-ADM-12): chats list and chat with approval cards for writes. */
export function AdminAssistantPage() {
  const t = useT("assistant.page")
  return (
    <PageContainer title={t("title")} description={t("description")}>
      <AssistantChat assistant="admin" basePath="/assistant" />
    </PageContainer>
  )
}
