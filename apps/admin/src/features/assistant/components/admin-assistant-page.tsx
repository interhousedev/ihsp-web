"use client"

import { AssistantWorkspace } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"

/**
 * The Administration assistant (ADM-15, AI-6, UF-ADM-12): the same chat module as the student assistant (sidebar of
 * chats, composer with slash commands, one usage meter), with approval cards for writes and none of the student
 * extras (notebooks, sharing, web search). It fills the area under the shell header.
 */
export function AdminAssistantPage() {
  const t = useT("assistant.page")
  return (
    <div className="h-[calc(100dvh-3.5rem-var(--safe-top))] min-h-0">
      <h1 className="sr-only">{t("title")}</h1>
      <AssistantWorkspace assistant="admin" basePath="/assistant" />
    </div>
  )
}
