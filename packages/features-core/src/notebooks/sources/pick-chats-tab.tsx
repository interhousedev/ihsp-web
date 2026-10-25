"use client"

import { getAiChatsQuery } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { SourceKindIcon } from "../lib/source-icons"
import type { PickTabProps } from "./add-types"
import { PickRow } from "./pick-row"
import { refValue } from "./source-rules"

/** The student's assistant chats (title, date); each adds a snapshot of the conversation. */
export function PickChatsTab({ sources, selection, full }: PickTabProps) {
  const t = useT("notebooks")
  const format = useFormatters()
  const chats = useQuery(getAiChatsQuery({ assistant: "student", limit: 100 }))
  const added = new Set(sources.filter((source) => source.kind === "chat").map((source) => refValue(source, "chat_id")))
  const items = chats.data?.items ?? []

  if (chats.isPending) return <StateView state="loading" rows={3} />
  if (chats.isError) return <StateView state="error" error={chats.error} onRetry={() => void chats.refetch()} />
  if (items.length === 0) return <StateView state="empty" emptyText={t("add.chats.empty")} />
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((chat) => {
        const key = `chat:${chat.id}`
        const already = added.has(chat.id)
        const checked = already || selection.has(key)
        return (
          <PickRow
            key={chat.id}
            label={chat.title}
            meta={format.date(chat.last_message_at)}
            note={already ? t("add.alreadyAdded") : undefined}
            icon={<SourceKindIcon kind="chat" />}
            checked={checked}
            disabled={already || (full && !checked)}
            onToggle={() => selection.toggle({ key, input: { kind: "chat", chat_id: chat.id }, label: chat.title })}
          />
        )
      })}
    </ul>
  )
}
