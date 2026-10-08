"use client"

import { AssistantChat } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"

/** `/assistant/` and `/assistant/chat/?id=`: the student assistant (WEB-25, AI-1). */
export function AssistantPage() {
  const t = useT("assistant.page")
  return (
    <PageContainer title={t("title")} description={t("description")}>
      <AssistantChat assistant="student" basePath="/assistant" />
    </PageContainer>
  )
}
