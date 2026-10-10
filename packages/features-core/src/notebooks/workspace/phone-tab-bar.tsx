"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { IconBooks, IconMessageCircle, IconWand } from "@ihsp/ui"
import { useRef, type KeyboardEvent } from "react"
import type { WorkspaceTab } from "../types"
import { WORKSPACE_TABS } from "./use-workspace-state"

const ICONS = { sources: IconBooks, chat: IconMessageCircle, studio: IconWand } as const

/** The `id` of the page a tab shows (`aria-controls`). */
export const TAB_PANEL_IDS: Record<WorkspaceTab, string> = {
  sources: "notebook-tab-sources",
  chat: "notebook-tab-chat",
  studio: "notebook-tab-studio",
}

type PhoneTabBarProps = {
  active: WorkspaceTab
  onSelect: (tab: WorkspaceTab) => void
}

/** The phone's bottom bar: Sources, Chat, Studio (56 px, safe-area bottom inset). */
export function PhoneTabBar({ active, onSelect }: PhoneTabBarProps) {
  const t = useT("notebooks")
  const buttons = useRef<Partial<Record<WorkspaceTab, HTMLButtonElement | null>>>({})

  function move(event: KeyboardEvent, from: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (step === 0 && event.key !== "Home" && event.key !== "End") return
    event.preventDefault()
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? WORKSPACE_TABS.length - 1
          : (from + step + WORKSPACE_TABS.length) % WORKSPACE_TABS.length
    const tab = WORKSPACE_TABS[target]
    if (!tab) return
    onSelect(tab)
    buttons.current[tab]?.focus()
  }

  return (
    <div className="bg-background shrink-0 border-t pb-[var(--safe-bottom)] print:hidden">
      <div role="tablist" aria-label={t("workspace.tabBar")} className="flex h-14">
        {WORKSPACE_TABS.map((tab, index) => {
          const Icon = ICONS[tab]
          const selected = tab === active
          return (
            <button
              key={tab}
              ref={(node) => {
                buttons.current[tab] = node
              }}
              type="button"
              role="tab"
              id={`notebook-tab-button-${tab}`}
              aria-selected={selected}
              aria-controls={TAB_PANEL_IDS[tab]}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "focus-visible:ring-ring flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset",
                selected ? "text-primary" : "text-muted-foreground",
              )}
              onClick={() => onSelect(tab)}
              onKeyDown={(event) => move(event, index)}
            >
              <Icon aria-hidden className="size-6" />
              <span className="max-w-full truncate">{t(`tabs.${tab}`)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
