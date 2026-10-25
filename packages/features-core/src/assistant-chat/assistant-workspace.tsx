"use client"

import type { AssistantKind } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@ihsp/ui"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AssistantProvider, useAssistantScope } from "./assistant-context"
import { AssistantChatPane } from "./assistant-chat-pane"
import { AssistantHome } from "./assistant-home"
import { AssistantSidebar } from "./assistant-sidebar"
import { UsageButton } from "./sidebar-usage"
import { useUsage } from "./use-assistant-queries"
import { useSidebarCollapsed } from "./use-sidebar-collapsed"
import { WorkspaceNavButtons } from "./workspace-nav-buttons"

export type AssistantWorkspaceProps = {
  assistant: Exclude<AssistantKind, "lms_author">
  /** Route of the assistant section; the chat page is `<basePath>/chat/?id=`. */
  basePath: string
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

/**
 * The Gemini-style student assistant (spec § 5.2): a 280 px sidebar from 1024 px (collapsible, remembered), a sheet on
 * smaller screens, and the home or the open chat (`?id=`) as the main area. Fill the height you give it
 * (`h-full`); the page wraps it in `<Suspense>` because it reads `useSearchParams`.
 */
export function AssistantWorkspace({ assistant, basePath }: AssistantWorkspaceProps) {
  return (
    <AssistantProvider assistant={assistant}>
      <WorkspaceBody basePath={basePath} />
    </AssistantProvider>
  )
}

function WorkspaceBody({ basePath }: { basePath: string }) {
  const t = useT("assistant")
  const chatId = useSearchParams().get("id")
  const [collapsed, setCollapsed] = useSidebarCollapsed()
  const [sheetOpen, setSheetOpen] = useState(false)
  const { assistant } = useAssistantScope()
  const usage = useUsage(assistant)
  // The sidebar shows the meter in full; wherever it is not on screen, a compact one sits in the top bar.
  const trailing = <UsageButton usage={usage.data} className={collapsed ? undefined : "lg:hidden"} />

  // `/` jumps to the composer unless the student is typing somewhere.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target)) return
      const field = document.querySelector<HTMLElement>("[data-assistant-composer]")
      if (!field) return
      event.preventDefault()
      field.focus()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const navButtons = (
    <WorkspaceNavButtons
      collapsed={collapsed}
      onOpenHistory={() => setSheetOpen(true)}
      onExpand={() => setCollapsed(false)}
    />
  )

  return (
    <div className="flex h-full min-h-0 w-full min-w-0">
      {collapsed ? null : (
        <aside className="bg-muted/30 hidden w-70 shrink-0 border-e lg:block">
          <AssistantSidebar
            inline
            basePath={basePath}
            activeChatId={chatId}
            onNavigate={() => setSheetOpen(false)}
            onCollapse={() => setCollapsed(true)}
          />
        </aside>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {chatId ? (
          <AssistantChatPane
            key={chatId}
            chatId={chatId}
            basePath={basePath}
            navButtons={navButtons}
            trailing={trailing}
          />
        ) : (
          <AssistantHome basePath={basePath} navButtons={navButtons} trailing={trailing} />
        )}
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[min(20rem,88vw)] gap-0 p-0 sm:max-w-80">
          <SheetHeader className="sr-only">
            <SheetTitle>{t("workspace.sidebar")}</SheetTitle>
            <SheetDescription>{t("workspace.history")}</SheetDescription>
          </SheetHeader>
          <AssistantSidebar basePath={basePath} activeChatId={chatId} onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
