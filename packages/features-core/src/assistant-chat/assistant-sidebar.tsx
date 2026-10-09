"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconEdit, IconLayoutSidebarLeftCollapse, IconSearch } from "@tabler/icons-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChatSearchDialog } from "./chat-search-dialog"
import { SidebarNotebooks } from "./sidebar-notebooks"
import { SidebarRecentChats } from "./sidebar-recent-chats"
import { SidebarUsage } from "./sidebar-usage"
import { useUsage } from "./use-assistant-queries"
import { useChatActions } from "./use-chat-actions"
import { notebookUrl } from "./use-add-to-notebook"

type AssistantSidebarProps = {
  basePath: string
  /** The open chat (highlighted in Recent). */
  activeChatId: string | null
  /** Called after the student navigated from the sidebar (the phone sheet closes). */
  onNavigate: () => void
  /** Desktop only: shows the collapse button. */
  onCollapse?: () => void
}

/** Left column of the assistant: New chat, Search chats, Notebooks, Recent chats and the usage ring. */
export function AssistantSidebar({ basePath, activeChatId, onNavigate, onCollapse }: AssistantSidebarProps) {
  const t = useT("assistant")
  const router = useRouter()
  const usage = useUsage("student")
  const [searchOpen, setSearchOpen] = useState(false)
  const actions = useChatActions({
    onDeleted: (id) => {
      if (id === activeChatId) router.replace(`${basePath}/`)
    },
  })

  return (
    <nav aria-label={t("workspace.sidebar")} className="flex h-full min-h-0 flex-col gap-2 p-3">
      <div className="flex h-11 shrink-0 items-center">
        {onCollapse ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-9"
            aria-label={t("sidebar.collapse")}
            onClick={onCollapse}
          >
            <IconLayoutSidebarLeftCollapse aria-hidden />
          </Button>
        ) : null}
      </div>
      <Link
        href={`${basePath}/`}
        onClick={onNavigate}
        className="bg-primary/10 text-primary hover:bg-primary/15 focus-visible:ring-ring/50 flex min-h-11 items-center gap-2 self-start rounded-full px-4 text-sm font-medium outline-none focus-visible:ring-3 md:min-h-9"
      >
        <IconEdit className="size-4" aria-hidden />
        {t("sidebar.newChat")}
      </Link>
      <button
        type="button"
        className="hover:bg-muted focus-visible:ring-ring/50 flex min-h-11 items-center gap-2 rounded-full px-3 text-sm outline-none focus-visible:ring-3 md:min-h-9"
        onClick={() => setSearchOpen(true)}
      >
        <IconSearch className="size-4" aria-hidden />
        {t("sidebar.search")}
      </button>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-2">
        <SidebarNotebooks onNavigate={onNavigate} />
        <SidebarRecentChats activeChatId={activeChatId} basePath={basePath} actions={actions} onNavigate={onNavigate} />
      </div>
      <SidebarUsage usage={usage.data} />
      <ChatSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onOpenChat={(chat) => {
          onNavigate()
          router.push(`${basePath}/chat/?id=${encodeURIComponent(chat.id)}`)
        }}
        onOpenNotebook={(notebook) => {
          onNavigate()
          router.push(notebookUrl(notebook.id))
        }}
      />
      {actions.dialogs}
    </nav>
  )
}
