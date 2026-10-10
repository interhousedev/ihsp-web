"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Skeleton } from "@ihsp/ui"
import { useState } from "react"
import { SidebarChatRow } from "./sidebar-chat-row"
import { useChats } from "./use-assistant-queries"
import type { ChatActions } from "./use-chat-actions"
import { useAssistantScope } from "./assistant-context"

const PAGE = 20

type SidebarRecentChatsProps = {
  activeChatId: string | null
  basePath: string
  actions: ChatActions
  onNavigate: () => void
}

/** Section **Recent**: the latest 20 chats, **Show more** adds 20 more. */
export function SidebarRecentChats({ activeChatId, basePath, actions, onNavigate }: SidebarRecentChatsProps) {
  const t = useT("assistant.sidebar")
  const tCommon = useT("common")
  const errorMessage = useErrorMessage()
  const { assistant } = useAssistantScope()
  const chats = useChats(assistant)
  const [visible, setVisible] = useState(PAGE)

  const items = chats.data?.items ?? []

  return (
    <section aria-labelledby="assistant-recent-heading" className="flex flex-col gap-1">
      <h3 id="assistant-recent-heading" className="text-muted-foreground px-3 py-1 text-xs font-medium">
        {t("recent")}
      </h3>
      {chats.isPending ? (
        <div role="status" aria-busy="true" aria-label={tCommon("loading")} className="flex flex-col gap-1">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-9 w-full rounded-full" />
          ))}
        </div>
      ) : null}
      {chats.isError ? (
        <div className="flex flex-col items-start gap-1 px-3">
          <p role="alert" className="text-destructive text-xs">
            {errorMessage(chats.error)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 md:min-h-7"
            onClick={() => void chats.refetch()}
          >
            {tCommon("retry")}
          </Button>
        </div>
      ) : null}
      {chats.isSuccess && items.length === 0 ? (
        <p className="text-muted-foreground px-3 py-2 text-sm">{t("empty")}</p>
      ) : null}
      {items.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {items.slice(0, visible).map((chat) => (
            <SidebarChatRow
              key={chat.id}
              chat={chat}
              active={chat.id === activeChatId}
              basePath={basePath}
              actions={actions}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
      {items.length > visible ? (
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground min-h-11 justify-start rounded-full px-3 md:min-h-9"
          onClick={() => setVisible((count) => count + PAGE)}
        >
          {t("showMore")}
        </Button>
      ) : null}
    </section>
  )
}
