"use client"

import { AssistantWorkspace } from "@ihsp/features-core"
import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"

/**
 * `/assistant/` and `/assistant/chat/?id=`: the student assistant, a Gemini-style workspace with a chats and notebooks
 * sidebar, a home with a greeting and a chat view (WEB-25, WEB-36, AI-1). It fills the area under the shell header; on
 * a phone the global bottom bar stays, so its height is left free.
 */
export function AssistantPage() {
  const t = useT("assistant.page")
  const app = useT("app")
  return (
    <div className="h-[calc(100dvh-var(--shell-top-reserve,0px)-var(--bottom-nav-height)-var(--safe-bottom))] min-h-0 md:h-[calc(100dvh-var(--shell-top-reserve,0px))]">
      <h1 className="sr-only">{t("title")}</h1>
      <AssistantWorkspace
        assistant="student"
        basePath="/assistant"
        libraryHref="/files/"
        connectorsHref={`${getConfig().ID_URL}/connectors/new/`}
        appName={app("name")}
      />
    </div>
  )
}
