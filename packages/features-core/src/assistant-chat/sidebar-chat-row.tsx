"use client"

import type { ChatItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, cn } from "@ihsp/ui"
import { IconDots } from "@ihsp/ui"
import Link from "next/link"
import { ChatMenuItems } from "./chat-menu-items"
import { SIDEBAR_ROW, SIDEBAR_ROW_ACTIVE } from "./sidebar-rows"
import type { ChatActions } from "./use-chat-actions"

type SidebarChatRowProps = {
  chat: ChatItem
  active: boolean
  basePath: string
  actions: ChatActions
  onNavigate: () => void
}

/** One recent chat: the title (truncated), a dot while an action waits for approval, and the ⋯ menu on hover or focus. */
export function SidebarChatRow({ chat, active, basePath, actions, onNavigate }: SidebarChatRowProps) {
  const t = useT("assistant")
  return (
    <li className="group/chat relative">
      <Link
        href={`${basePath}/chat/?id=${encodeURIComponent(chat.id)}`}
        aria-current={active ? "page" : undefined}
        title={chat.title}
        onClick={onNavigate}
        className={cn(SIDEBAR_ROW, "pe-11", active && SIDEBAR_ROW_ACTIVE)}
      >
        <span className="min-w-0 flex-1 truncate">{chat.title}</span>
        {chat.pending_approvals > 0 ? (
          <span
            role="img"
            aria-label={t("list.pending", { count: chat.pending_approvals })}
            className="bg-primary size-2 shrink-0 rounded-full"
          />
        ) : null}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="pointer-coarse:opacity-100 absolute end-0 top-1/2 size-11 -translate-y-1/2 rounded-lg opacity-0 md:end-1 md:size-7 group-hover/chat:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
              aria-label={t("sidebar.chatMenu", { title: chat.title })}
            />
          }
        >
          <IconDots aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <ChatMenuItems chat={chat} actions={actions} />
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
