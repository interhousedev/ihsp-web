"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { AssistantChatPane } from "../assistant-chat/assistant-chat-pane"
import { storePendingTurn } from "../assistant-chat/pending-turn"
import { useCreateChat } from "../assistant-chat/use-assistant-queries"

/** The compact chat of the help widget: a new chat, optionally seeded with what the user typed in the search. */
export default function HelpChat({ seed, onBack }: { seed: string; onBack: () => void }) {
  const t = useT("helpWidget")
  const create = useCreateChat("student")
  const [chatId, setChatId] = useState<string | null>(null)
  const started = useRef(false)

  const start = () =>
    create.mutate(undefined, {
      onSuccess: (chat) => {
        if (seed) storePendingTurn(chat.id, { text: t("seed", { query: seed }), file_ids: [] })
        setChatId(chat.id)
      },
    })

  useEffect(() => {
    if (started.current) return
    started.current = true
    start()
    // The chat is created once per opening of the chat stage.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Button type="button" variant="ghost" size="sm" className="min-h-11 self-start md:min-h-8" onClick={onBack}>
        <Icons.chevronLeft aria-hidden />
        {t("backToMap")}
      </Button>
      {create.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2 text-sm">
          <p>{t("chatError")}</p>
          <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={start}>
            {t("retry")}
          </Button>
        </div>
      ) : null}
      {chatId ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <AssistantChatPane
            chatId={chatId}
            basePath="/assistant"
            navButtons={null}
            bare
            placeholder={t("chatPlaceholder")}
            empty={
              <div className="flex flex-col gap-1 p-3 text-sm">
                <p className="font-medium">{t("starterTitle")}</p>
                <p className="text-muted-foreground">{t("starterBody")}</p>
              </div>
            }
          />
        </div>
      ) : null}
    </div>
  )
}
