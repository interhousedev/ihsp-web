"use client"

import type { AssistantKind, ChatItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, ConfirmDialog, StateView } from "@ihsp/ui"
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { RenameChatDialog } from "./rename-chat-dialog"
import { useChats, useCreateChat, useDeleteChat, useRenameChat } from "./use-assistant-queries"

type ChatListProps = {
  assistant: AssistantKind
  basePath: string
  activeId: string | null
  onOpen: (id: string) => void
  onDeleted: (id: string) => void
}

/** The student's chats: open, create, rename and delete (AI-1). */
export function ChatList({ assistant, basePath, activeId, onOpen, onDeleted }: ChatListProps) {
  const t = useT("assistant.list")
  const format = useFormatters()
  const chats = useChats(assistant)
  const create = useCreateChat(assistant)
  const rename = useRenameChat(assistant)
  const remove = useDeleteChat(assistant)
  const [renaming, setRenaming] = useState<ChatItem | null>(null)
  const [deleting, setDeleting] = useState<ChatItem | null>(null)

  function createChat() {
    create.mutate(undefined, {
      onSuccess: (chat) => onOpen(chat.id),
      onError: () => toast.error(t("createFailed")),
    })
  }

  const newChatButton = (
    <Button type="button" className="min-h-11" disabled={create.isPending} onClick={createChat}>
      <IconPlus aria-hidden />
      {t("new")}
    </Button>
  )

  return (
    <section aria-label={t("title")} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        {newChatButton}
      </div>
      {chats.isPending ? <StateView state="loading" rows={4} /> : null}
      {chats.isError ? <StateView state="error" error={chats.error} onRetry={() => void chats.refetch()} /> : null}
      {chats.isSuccess && chats.data.items.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} action={newChatButton} />
      ) : null}
      {chats.isSuccess && chats.data.items.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {chats.data.items.map((chat) => (
            <li
              key={chat.id}
              className={`flex items-center gap-1 rounded-lg border pr-1 ${chat.id === activeId ? "bg-muted border-primary/40" : "bg-card"}`}
            >
              <Link
                href={`${basePath}/chat/?id=${encodeURIComponent(chat.id)}`}
                aria-current={chat.id === activeId ? "page" : undefined}
                className="flex min-h-14 min-w-0 flex-1 flex-col justify-center px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <span className="min-w-0 truncate text-sm font-medium">{chat.title}</span>
                  {chat.pending_approvals > 0 ? (
                    <Badge variant="secondary">{t("pending", { count: chat.pending_approvals })}</Badge>
                  ) : null}
                </span>
                <span className="text-muted-foreground text-xs">{format.relative(chat.last_message_at)}</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0"
                aria-label={t("rename", { title: chat.title })}
                onClick={() => setRenaming(chat)}
              >
                <IconPencil aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0"
                aria-label={t("delete", { title: chat.title })}
                onClick={() => setDeleting(chat)}
              >
                <IconTrash aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <RenameChatDialog
        chat={renaming}
        pending={rename.isPending}
        error={rename.error}
        onClose={() => {
          setRenaming(null)
          rename.reset()
        }}
        onSave={(chat, title) => rename.mutate({ id: chat.id, title }, { onSuccess: () => setRenaming(null) })}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title={t("deleteTitle")}
        description={deleting ? t("deleteDescription", { title: deleting.title }) : undefined}
        confirmLabel={t("deleteConfirm")}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          const id = deleting.id
          remove.mutate(id, {
            onSuccess: () => {
              setDeleting(null)
              onDeleted(id)
            },
            onError: () => toast.error(t("deleteFailed")),
          })
        }}
      />
    </section>
  )
}
