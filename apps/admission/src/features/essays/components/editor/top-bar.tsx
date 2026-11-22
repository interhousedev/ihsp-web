"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
  Input,
  cn,
} from "@ihsp/ui"
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
  onCopy: () => void
  onPreview: () => void
  onPeek: () => void
  onVersions: () => void
  onComments: () => void
  onShare: () => void
  commentsOpen: boolean
  copyDisabled: boolean
}

const DOT = {
  saved: "bg-success",
  dirty: "bg-muted-foreground",
  saving: "bg-primary animate-pulse",
  conflict: "bg-destructive",
  error: "bg-destructive",
} as const

/**
 * One row at every width: back, the title, the word count and the save state. From 768 the actions follow as icons
 * (Copy final text, Preview, Share); on a phone they live in the "more" menu so the row stays one line.
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
  onCopy,
  onPreview,
  onPeek,
  onVersions,
  onComments,
  onShare,
  commentsOpen,
  copyDisabled,
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
        className="h-8 min-w-0 flex-1 border-transparent bg-transparent px-2 text-base font-medium text-ellipsis shadow-none hover:border-input focus-visible:bg-background"
      />
      <span
        id="essay-count"
        className={cn(
          "shrink-0 text-xs tabular-nums sm:text-sm",
          over ? "text-destructive font-medium" : "text-muted-foreground",
        )}
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
      <div className="hidden items-center gap-0.5 md:flex">
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
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={te("copyFinal")}
          disabled={copyDisabled}
          onClick={onCopy}
        >
          <Icons.copy aria-hidden />
        </Button>
        <Button type="button" size="icon-sm" variant="ghost" aria-label={te("preview")} onClick={onPreview}>
          <Icons.eye aria-hidden />
        </Button>
        <Button type="button" size="icon-sm" variant="ghost" aria-label={te("peek")} onClick={onPeek}>
          <Icons.files aria-hidden />
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-full px-3 lg:px-4"
          aria-label={t("editor.share")}
          onClick={onShare}
        >
          <Icons.share aria-hidden />
          <span className="hidden lg:inline">{t("editor.share")}</span>
        </Button>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={te("more")}
          render={<Button type="button" size="icon-sm" variant="ghost" className="md:hidden" />}
        >
          <Icons.moreHorizontal aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={copyDisabled} onClick={onCopy}>
            <Icons.copy aria-hidden />
            {te("copyFinal")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPreview}>
            <Icons.eye aria-hidden />
            {te("preview")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPeek}>
            <Icons.files aria-hidden />
            {te("peek")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShare}>
            <Icons.share aria-hidden />
            {t("editor.share")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onVersions}>
            <Icons.clock aria-hidden />
            {t("editor.versions")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onComments}>
            <Icons.chat aria-hidden />
            {t("tabs.comments")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
