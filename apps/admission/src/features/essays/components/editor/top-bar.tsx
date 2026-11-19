"use client"

import { useT } from "@ihsp/i18n"
import { Avatar, AvatarFallback, Button, Icons, Input } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"

export type TopBarProps = {
  title: string
  onTitle: (value: string) => void
  /** Save status line ("Saved", "Saving…"), with an optional retry button. */
  status: ReactNode
  onRail: () => void
  onVersions: () => void
  onComments: () => void
  onShare: () => void
  commentsOpen: boolean
}

/** Title (inline editable), save status, version history, comments, the blue Share pill and the avatar. */
export function TopBar({ title, onTitle, status, onRail, onVersions, onComments, onShare, commentsOpen }: TopBarProps) {
  const t = useT("essays")
  return (
    <header className="bg-background border-hairline flex flex-wrap items-center gap-2 border-b px-3 py-2">
      <Link
        href="/essays/"
        aria-label={t("back")}
        className="text-muted-foreground hover:text-foreground inline-flex size-9 items-center justify-center"
      >
        <Icons.chevronLeft aria-hidden />
      </Link>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="lg:hidden"
        aria-label={t("editor.rail.title")}
        onClick={onRail}
      >
        <Icons.panelLeft aria-hidden />
      </Button>
      <div className="flex min-w-0 flex-1 flex-col">
        <Input
          aria-label={t("titleLabel")}
          value={title ?? ""}
          maxLength={120}
          onChange={(event) => onTitle(event.target.value)}
          className="h-8 border-transparent bg-transparent px-2 text-base font-medium shadow-none hover:border-input focus-visible:bg-background"
        />
        <span
          id="essay-save"
          role="status"
          aria-live="polite"
          className="text-muted-foreground flex items-center gap-2 px-2 text-xs"
        >
          {status}
        </span>
      </div>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={t("editor.versions")} onClick={onVersions}>
        <Icons.clock aria-hidden />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={t("tabs.comments")}
        aria-pressed={commentsOpen}
        onClick={onComments}
      >
        <Icons.chat aria-hidden />
      </Button>
      <Button type="button" size="sm" className="rounded-full px-4" onClick={onShare}>
        <Icons.share aria-hidden />
        {t("editor.share")}
      </Button>
      <Avatar className="size-8">
        <AvatarFallback>
          <Icons.user aria-hidden />
        </AvatarFallback>
      </Avatar>
    </header>
  )
}
