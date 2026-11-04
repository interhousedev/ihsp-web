"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconBooks, IconEdit, IconLayoutSidebarLeftCollapse, IconLink, IconSearch } from "@ihsp/ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChatSearchDialog } from "./chat-search-dialog"
import { SidebarNotebooks } from "./sidebar-notebooks"
import { SidebarProjects } from "./sidebar-projects"
import { SidebarRecentChats } from "./sidebar-recent-chats"
import { SIDEBAR_ROW, SidebarIcon } from "./sidebar-rows"
import { SidebarUsage } from "./sidebar-usage"
import { useUsage } from "./use-assistant-queries"
import { useChatActions } from "./use-chat-actions"
import { notebookUrl } from "./use-add-to-notebook"
import { useAssistantScope } from "./assistant-context"

/** Destinations of the app around the assistant; a link the app does not have is left out of the sidebar. */
export type AssistantSidebarLinks = {
  /** The app's library (the student's files); absent where the app has none. */
  libraryHref?: string
  /** The MCP setup wizard on the id app (absolute address); absent where the app has none (MCP-5). */
  connectorsHref?: string
  /** The app's brand name (its `app.name` message), used in the wizard link's label. */
  appName?: string
}

type AssistantSidebarProps = AssistantSidebarLinks & {
  basePath: string
  /** The open chat (highlighted in Recent). */
  activeChatId: string | null
  /** Called after the student navigated from the sidebar (the phone sheet closes). */
  onNavigate: () => void
  /** Desktop only: shows the collapse button. */
  onCollapse?: () => void
  /** Show the usage meter in the sidebar (desktop); the phone sheet has the compact one in the top bar. */
  inline?: boolean
}

/** Left column of the assistant: New chat, Search chats, Library, then Projects, Notebooks and Recents, and the usage ring. The account lives in the app shell. */
export function AssistantSidebar({
  basePath,
  activeChatId,
  onNavigate,
  onCollapse,
  inline = false,
  libraryHref,
  connectorsHref,
  appName,
}: AssistantSidebarProps) {
  const t = useT("assistant")
  const router = useRouter()
  const { assistant, features } = useAssistantScope()
  const usage = useUsage(assistant)
  const [searchOpen, setSearchOpen] = useState(false)
  const actions = useChatActions({
    onDeleted: (id) => {
      if (id === activeChatId) router.replace(`${basePath}/`)
    },
  })

  return (
    <nav aria-label={t("workspace.sidebar")} className="flex h-full min-h-0 flex-col gap-0.5 p-3">
      <div className="mb-1.5 flex h-11 shrink-0 items-center">
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
      <Link href={`${basePath}/`} onClick={onNavigate} className={SIDEBAR_ROW}>
        <SidebarIcon>
          <IconEdit className="size-4" aria-hidden />
        </SidebarIcon>
        {t("sidebar.newChat")}
      </Link>
      <button type="button" className={SIDEBAR_ROW} onClick={() => setSearchOpen(true)}>
        <SidebarIcon>
          <IconSearch className="size-4" aria-hidden />
        </SidebarIcon>
        {t("sidebar.search")}
      </button>
      {libraryHref ? (
        <Link href={libraryHref} onClick={onNavigate} className={SIDEBAR_ROW}>
          <SidebarIcon>
            <IconBooks className="size-4" aria-hidden />
          </SidebarIcon>
          {t("sidebar.library")}
        </Link>
      ) : null}
      {connectorsHref ? (
        <a href={connectorsHref} rel="noopener noreferrer" onClick={onNavigate} className={SIDEBAR_ROW}>
          <SidebarIcon>
            <IconLink className="size-4" aria-hidden />
          </SidebarIcon>
          {t("sidebar.connectAi", { app: appName ?? "" })}
        </a>
      ) : null}
      {/* Everything below the pinned rows scrolls as one column, so a long project list never squeezes Recents. */}
      <div data-scroll="sections" className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {assistant === "student" ? (
          <SidebarProjects basePath={basePath} activeChatId={activeChatId} onNavigate={onNavigate} />
        ) : null}
        {features.notebooks ? <SidebarNotebooks onNavigate={onNavigate} /> : null}
        <SidebarRecentChats activeChatId={activeChatId} basePath={basePath} actions={actions} onNavigate={onNavigate} />
      </div>
      {inline ? <SidebarUsage usage={usage.data} /> : null}
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
