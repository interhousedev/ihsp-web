"use client"

import { AssistantWorkspace } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"

/**
 * `/assistant/`, `/assistant/chat/?id=`, `/assistant/projects/` and `/assistant/project/?id=`: the student assistant in
 * the staff app, the same workspace as in sp (sidebar with Projects, home, chat and project pages).
 */
export function AssistantPage() {
  const t = useT("assistant.page")
  return (
    <div className="h-[calc(100dvh-var(--shell-top-reserve,0px))] min-h-0">
      <h1 className="sr-only">{t("title")}</h1>
      <AssistantWorkspace assistant="student" basePath="/assistant" />
    </div>
  )
}
