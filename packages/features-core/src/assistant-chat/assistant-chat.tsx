"use client"

import type { AssistantKind } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useRouter, useSearchParams } from "next/navigation"
import { ChatList } from "./chat-list"
import { ChatView } from "./chat-view"

export type AssistantChatProps = {
  assistant: AssistantKind
  /** Route of the assistant section in the app; the chat page is `<basePath>/chat/?id=`. */
  basePath?: string
}

/**
 * Chats list and chat view of an assistant (AI-1): `/assistant/` shows the list, `/assistant/chat/?id=` the chat.
 * On a phone one pane is shown at a time, on desktop both. Pages wrap it in `<Suspense>` (it reads `?id=`).
 */
export function AssistantChat({ assistant, basePath = "/assistant" }: AssistantChatProps) {
  const t = useT("assistant.chat")
  const router = useRouter()
  const chatId = useSearchParams().get("id")

  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-[20rem_minmax(0,1fr)]">
      <div className={chatId ? "hidden md:block" : "block"}>
        <ChatList
          assistant={assistant}
          basePath={basePath}
          activeId={chatId}
          onOpen={(id) => router.push(`${basePath}/chat/?id=${encodeURIComponent(id)}`)}
          onDeleted={(id) => {
            if (id === chatId) router.replace(`${basePath}/`)
          }}
        />
      </div>
      <div className={chatId ? "block min-w-0" : "hidden min-w-0 md:block"}>
        {chatId ? (
          <ChatView key={chatId} chatId={chatId} assistant={assistant} basePath={basePath} />
        ) : (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            {t("selectChat")}
          </p>
        )}
      </div>
    </div>
  )
}
