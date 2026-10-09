"use client"

import type { ChatItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ConfirmDialog } from "@ihsp/ui"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { RenameChatDialog } from "./rename-chat-dialog"
import { ShareDialog } from "./share-dialog"
import { useDeleteChat, useRenameChat } from "./use-assistant-queries"

export type ChatActions = {
  renameChat: (chat: ChatItem) => void
  shareChat: (chat: ChatItem) => void
  deleteChat: (chat: ChatItem) => void
}

type UseChatActionsOptions = {
  /** Called after a chat was deleted (the page leaves it when it was the open one). */
  onDeleted?: (id: string) => void
}

/**
 * Rename, share and delete dialogs of student chats. Call `renameChat`, `shareChat` or `deleteChat` from a menu and
 * render `dialogs` once next to it; the dialogs outlive the menu that opened them.
 */
export function useChatActions({ onDeleted }: UseChatActionsOptions = {}): ChatActions & { dialogs: ReactNode } {
  const t = useT("assistant.list")
  const rename = useRenameChat("student")
  const remove = useDeleteChat("student")
  const [renaming, setRenaming] = useState<ChatItem | null>(null)
  const [sharing, setSharing] = useState<ChatItem | null>(null)
  const [deleting, setDeleting] = useState<ChatItem | null>(null)

  const dialogs = (
    <>
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
      {sharing ? (
        <ShareDialog
          key={sharing.id}
          open
          onOpenChange={(open) => {
            if (!open) setSharing(null)
          }}
          kind="chat"
          targetId={sharing.id}
        />
      ) : null}
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
              onDeleted?.(id)
            },
            onError: () => toast.error(t("deleteFailed")),
          })
        }}
      />
    </>
  )

  return { renameChat: setRenaming, shareChat: setSharing, deleteChat: setDeleting, dialogs }
}
