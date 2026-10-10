"use client"

import type { ChatDetail } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, Input } from "@ihsp/ui"
import { IconArrowLeft, IconDotsVertical } from "@tabler/icons-react"
import Link from "next/link"
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { toast } from "sonner"
import { ChatMenuItems } from "./chat-menu-items"
import { useRenameChat } from "./use-assistant-queries"
import type { ChatActions } from "./use-chat-actions"
import { useAssistantScope } from "./assistant-context"

const MAX_TITLE_LENGTH = 120

type ChatPaneHeaderProps = {
  chat: ChatDetail
  /** Where the phone back arrow goes (the assistant home). */
  homeHref: string
  /** Sidebar buttons of the workspace (history sheet on phones, open the sidebar when it is hidden). */
  navButtons: ReactNode
  actions: ChatActions
  /** Compact usage meter (phones, hidden sidebar). */
  trailing?: ReactNode
}

/** Top bar of a chat: back arrow (phones), title (click to rename), ⋮ menu. */
export function ChatPaneHeader({ chat, homeHref, navButtons, actions, trailing }: ChatPaneHeaderProps) {
  const t = useT("assistant")
  const errorMessage = useErrorMessage()
  const { assistant } = useAssistantScope()
  const rename = useRenameChat(assistant)
  const [editing, setEditing] = useState(false)
  // Enter closes the field, and a browser may then report a blur for the removed field: save once.
  const settled = useRef(false)

  function startEditing() {
    settled.current = false
    setEditing(true)
  }

  function commit(value: string) {
    if (settled.current) return
    settled.current = true
    setEditing(false)
    const title = value.trim()
    if (title === "" || title === chat.title) return
    rename.mutate({ id: chat.id, title }, { onError: (error) => toast.error(errorMessage(error)) })
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault()
      commit(event.currentTarget.value)
    } else if (event.key === "Escape") {
      event.preventDefault()
      settled.current = true
      setEditing(false)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b px-2 md:px-4">
      <Link
        href={homeHref}
        aria-label={t("chat.back")}
        className="hover:bg-muted inline-flex size-11 shrink-0 items-center justify-center rounded-lg lg:hidden"
      >
        <IconArrowLeft aria-hidden />
      </Link>
      {navButtons}
      <h2 className="min-w-0 flex-1">
        {editing ? (
          <Input
            autoFocus
            aria-label={t("pane.title")}
            defaultValue={chat.title}
            maxLength={MAX_TITLE_LENGTH}
            className="min-h-11 text-base font-medium"
            onKeyDown={onKeyDown}
            onBlur={(event) => commit(event.currentTarget.value)}
          />
        ) : (
          <button
            type="button"
            title={t("menu.rename")}
            className="hover:bg-muted focus-visible:ring-ring/50 block min-h-11 w-full min-w-0 truncate rounded-lg px-2 text-start text-base font-medium outline-none focus-visible:ring-3"
            onClick={startEditing}
          >
            {chat.title}
          </button>
        )}
      </h2>
      {trailing}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              aria-label={t("pane.options")}
            />
          }
        >
          <IconDotsVertical aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <ChatMenuItems chat={chat} actions={actions} />
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
