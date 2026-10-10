"use client"

import type { NotebookItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { IconPinFilled, cn } from "@ihsp/ui"
import Link from "next/link"
import { notebookHref } from "../utils/hrefs"
import { NotebookCardMenu } from "./notebook-card-menu"

/** The emoji of a notebook that has none. */
const FALLBACK_EMOJI = "📓"

/**
 * One notebook of the list: emoji, title (two lines), "N sources · opened …", a pin marker and the ⋮ menu. `compact`
 * is the shorter card used inside the folders, where a folder can hold 30 notebooks or more.
 */
export function NotebookCard({ notebook, compact = false }: { notebook: NotebookItem; compact?: boolean }) {
  const t = useT("notebooks")
  const format = useFormatters()
  const when = format.relative(notebook.last_opened_at ?? notebook.updated_at)

  return (
    <li className="relative">
      <Link
        href={notebookHref(notebook.id)}
        className={cn(
          "bg-card hover:bg-muted/50 focus-visible:ring-ring ring-foreground/10 flex h-full flex-col rounded-xl text-start ring-1 transition-colors outline-none focus-visible:ring-2",
          compact ? "min-h-20 gap-1.5 p-3" : "min-h-32 gap-3 p-4",
        )}
      >
        <span aria-hidden className={cn("leading-none", compact ? "text-2xl" : "text-4xl")}>
          {notebook.emoji ?? FALLBACK_EMOJI}
        </span>
        <span
          className={cn("line-clamp-2 min-w-0 leading-snug font-medium break-words", compact ? "text-sm" : "text-base")}
        >
          {notebook.title}
        </span>
        <span className="text-muted-foreground mt-auto flex items-center gap-1.5 text-xs">
          {notebook.pinned ? (
            <IconPinFilled role="img" aria-label={t("card.pinned")} className="size-3.5 shrink-0" />
          ) : null}
          {t("list.meta", { sources: t("list.sources", { count: notebook.source_count }), when })}
        </span>
      </Link>
      <NotebookCardMenu notebook={notebook} />
    </li>
  )
}
