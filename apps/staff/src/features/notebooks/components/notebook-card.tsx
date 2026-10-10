"use client"

import type { NotebookItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { IconPinFilled } from "@tabler/icons-react"
import Link from "next/link"
import { notebookHref } from "../utils/hrefs"
import { NotebookCardMenu } from "./notebook-card-menu"

/** The emoji of a notebook that has none. */
const FALLBACK_EMOJI = "📓"

/** One notebook of the list: emoji, title (two lines), "N sources · opened …", a pin marker and the ⋮ menu. */
export function NotebookCard({ notebook }: { notebook: NotebookItem }) {
  const t = useT("notebooks")
  const format = useFormatters()
  const when = format.relative(notebook.last_opened_at ?? notebook.updated_at)

  return (
    <li className="relative">
      <Link
        href={notebookHref(notebook.id)}
        className="bg-card hover:bg-muted/50 focus-visible:ring-ring ring-foreground/10 flex h-full min-h-32 flex-col gap-3 rounded-xl p-4 text-start ring-1 transition-colors outline-none focus-visible:ring-2"
      >
        <span aria-hidden className="text-4xl leading-none">
          {notebook.emoji ?? FALLBACK_EMOJI}
        </span>
        <span className="line-clamp-2 min-w-0 text-base leading-snug font-medium break-words">{notebook.title}</span>
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
