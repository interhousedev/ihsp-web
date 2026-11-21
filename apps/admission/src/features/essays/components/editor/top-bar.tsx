"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, cn } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"

export type TopBarProps = {
  title: string
  onTitle: (value: string) => void
  words: number
  wordLimit: number | null
  /** Save status text ("Saved", "Saving…"), with an optional retry button. */
  status: ReactNode
  saveState: "saved" | "dirty" | "saving" | "conflict" | "error"
  onUndo: () => void
  onRedo: () => void
  onTools: () => void
  onVersions: () => void
  onComments: () => void
  onShare: () => void
  commentsOpen: boolean
}

const DOT = {
  saved: "bg-success",
  dirty: "bg-muted-foreground",
  saving: "bg-primary animate-pulse",
  conflict: "bg-destructive",
  error: "bg-destructive",
} as const

/**
 * One row at every width: back, the title, the word count and the save state. From the lg width the actions follow;
 * on a phone they live in the "more" sheet so the row stays one line.
 */
export function TopBar({
  title,
  onTitle,
  words,
  wordLimit,
  status,
  saveState,
  onUndo,
  onRedo,
  onTools,
  onVersions,
  onComments,
  onShare,
  commentsOpen,
}: TopBarProps) {
  const t = useT("essays")
  const te = useT("essayEditor")
  const over = wordLimit !== null && wordLimit > 0 && words > wordLimit
  return (
    <header className="bg-background border-hairline flex items-center gap-1.5 border-b px-2 py-1.5 md:gap-2 md:px-3">
      <Link
        href="/essays/"
        aria-label={t("back")}
        className="text-muted-foreground hover:text-foreground inline-flex size-9 shrink-0 items-center justify-center"
      >
        <Icons.chevronLeft aria-hidden />
      </Link>
      <Input
        aria-label={t("titleLabel")}
        value={title ?? ""}
        maxLength={120}
        onChange={(event) => onTitle(event.target.value)}
        className="h-8 min-w-0 flex-1 border-transparent bg-transparent px-2 text-base font-medium shadow-none hover:border-input focus-visible:bg-background"
      />
      <span
        id="essay-count"
        className={cn("shrink-0 text-xs tabular-nums sm:text-sm", over ? "text-destructive font-medium" : "text-muted-foreground")}
      >
        {wordLimit ? t("wordsOf", { count: words, limit: wordLimit }) : t("words", { count: words })}
      </span>
      <span
        id="essay-save"
        role="status"
        aria-live="polite"
        className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs"
      >
        <span aria-hidden className={cn("size-2 rounded-full", DOT[saveState])} />
        <span className={saveState === "saved" ? "sr-only sm:not-sr-only" : "sr-only md:not-sr-only"}>{status}</span>
      </span>
      <div className="hidden items-center gap-1 lg:flex">
        <Button type="button" size="icon-sm" variant="ghost" aria-label={t("editor.undo")} onClick={onUndo}>
          <Icons.undo aria-hidden />
        </Button>
        <Button type="button" size="icon-sm" variant="ghost" aria-label={t("editor.redo")} onClick={onRedo}>
          <Icons.undo aria-hidden className="-scale-x-100" />
        </Button>
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
        <Button type="button" size="sm" variant="outline" onClick={onTools}>
          {t("editor.tools")}
        </Button>
        <Button type="button" size="sm" className="rounded-full px-4" onClick={onShare}>
          <Icons.share aria-hidden />
          {t("editor.share")}
        </Button>
      </div>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="lg:hidden"
        aria-label={te("more")}
        onClick={onTools}
      >
        <Icons.moreHorizontal aria-hidden />
      </Button>
    </header>
  )
}
