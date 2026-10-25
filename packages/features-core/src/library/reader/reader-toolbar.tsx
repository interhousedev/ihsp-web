"use client"

import { useT } from "@ihsp/i18n"
import { Button, OfflineBadge, buttonVariants, cn } from "@ihsp/ui"
import { IconArrowLeft, IconDotsVertical, IconHighlight, IconList, IconSearch, IconSettings } from "@ihsp/ui"
import Link from "next/link"

export type ReaderToolbarProps = {
  title: string
  backHref: string
  onContents(): void
  onSearch(): void
  onNotes(): void
  notesOpen: boolean
  onSettings(): void
  onMenu(): void
  /** Changes that wait for the network. */
  waiting: number
}

const ICON_BUTTON = "size-11 md:size-8"

/** The top bar: back, title, contents, search, notes (wide screens), settings and the menu. */
export function ReaderToolbar({
  title,
  backHref,
  onContents,
  onSearch,
  onNotes,
  notesOpen,
  onSettings,
  onMenu,
  waiting,
}: ReaderToolbarProps) {
  const t = useT("library.reader")
  const offline = useT("library.offline")
  return (
    <header className="bg-background flex shrink-0 items-center gap-1 border-b px-2 pt-[var(--safe-top,0px)]">
      <Link
        href={backHref}
        aria-label={t("back")}
        className={buttonVariants({ variant: "ghost", size: "icon", className: ICON_BUTTON })}
      >
        <IconArrowLeft aria-hidden />
      </Link>
      <h1 className="min-w-0 flex-1 truncate px-1 text-sm font-medium" title={title}>
        {title}
      </h1>
      <OfflineBadge />
      {waiting > 0 ? (
        <span role="status" className="text-muted-foreground hidden text-xs sm:inline">
          {offline("waiting", { count: waiting })}
        </span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("contents")}
        className={ICON_BUTTON}
        onClick={onContents}
      >
        <IconList aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("search")}
        className={ICON_BUTTON}
        onClick={onSearch}
      >
        <IconSearch aria-hidden />
      </Button>
      <Button
        type="button"
        variant={notesOpen ? "secondary" : "ghost"}
        size="icon"
        aria-label={t("notes")}
        aria-pressed={notesOpen}
        className={cn(ICON_BUTTON, "hidden md:inline-flex")}
        onClick={onNotes}
      >
        <IconHighlight aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("settings")}
        className={ICON_BUTTON}
        onClick={onSettings}
      >
        <IconSettings aria-hidden />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label={t("menu")} className={ICON_BUTTON} onClick={onMenu}>
        <IconDotsVertical aria-hidden />
      </Button>
    </header>
  )
}
