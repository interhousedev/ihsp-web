"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconHistory, IconLayoutSidebarLeftExpand } from "@tabler/icons-react"

type WorkspaceNavButtonsProps = {
  /** The desktop sidebar is hidden. */
  collapsed: boolean
  onOpenHistory: () => void
  onExpand: () => void
}

/** Top-bar buttons that bring the sidebar back: "history" opens the sheet below 1024 px, the other shows the hidden one. */
export function WorkspaceNavButtons({ collapsed, onOpenHistory, onExpand }: WorkspaceNavButtonsProps) {
  const t = useT("assistant")
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 lg:hidden"
        aria-label={t("workspace.history")}
        onClick={onOpenHistory}
      >
        <IconHistory aria-hidden />
      </Button>
      {collapsed ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden size-11 shrink-0 lg:inline-flex"
          aria-label={t("sidebar.open")}
          onClick={onExpand}
        >
          <IconLayoutSidebarLeftExpand aria-hidden />
        </Button>
      ) : null}
    </>
  )
}
