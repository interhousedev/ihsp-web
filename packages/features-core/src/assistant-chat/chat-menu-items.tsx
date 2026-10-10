"use client"

import type { ChatItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { DropdownMenuItem, DropdownMenuSeparator } from "@ihsp/ui"
import { IconPencil, IconShare, IconTrash } from "@tabler/icons-react"
import { useAssistantScope } from "./assistant-context"
import { AddToNotebookSubMenu } from "./add-to-notebook-menu"
import type { ChatActions } from "./use-chat-actions"

const ITEM_CLASS = "min-h-11 md:min-h-8"

/** Entries of a chat's menu: Rename, Share, Add to notebook ▸, Delete. Place inside a `DropdownMenuContent`. */
export function ChatMenuItems({ chat, actions }: { chat: ChatItem; actions: ChatActions }) {
  const t = useT("assistant")
  const { features } = useAssistantScope()
  return (
    <>
      <DropdownMenuItem className={ITEM_CLASS} onClick={() => actions.renameChat(chat)}>
        <IconPencil aria-hidden />
        {t("menu.rename")}
      </DropdownMenuItem>
      {features.share ? (
        <DropdownMenuItem className={ITEM_CLASS} onClick={() => actions.shareChat(chat)}>
          <IconShare aria-hidden />
          {t("chat.share")}
        </DropdownMenuItem>
      ) : null}
      {features.notebooks ? <AddToNotebookSubMenu input={{ kind: "chat", chat_id: chat.id }} /> : null}
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" className={ITEM_CLASS} onClick={() => actions.deleteChat(chat)}>
        <IconTrash aria-hidden />
        {t("menu.delete")}
      </DropdownMenuItem>
    </>
  )
}
