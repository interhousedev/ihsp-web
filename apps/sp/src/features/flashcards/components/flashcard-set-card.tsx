"use client"

import type { FlashcardSetItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Card, CardContent } from "@ihsp/ui"
import Link from "next/link"
import { SourceBadge } from "./source-badge"

/** One set in the list: title, counts and the Study shortcut. */
export function FlashcardSetCard({ set }: { set: FlashcardSetItem }) {
  const t = useT("flashcards.list")
  const href = `/flashcards/set/?id=${encodeURIComponent(set.id)}`
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold break-words">
              <Link href={href} className="hover:underline">
                {set.title}
              </Link>
            </h2>
            {set.description ? (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm break-words">{set.description}</p>
            ) : null}
          </div>
          <SourceBadge source={set.source} />
        </div>
        <dl className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <div className="flex gap-1">
            <dt>{t("due")}</dt>
            <dd className="text-foreground font-medium">{set.due_today}</dd>
          </div>
          <div className="flex gap-1">
            <dt>{t("new")}</dt>
            <dd className="text-foreground font-medium">{set.new_today}</dd>
          </div>
          <div className="flex gap-1">
            <dt>{t("cards")}</dt>
            <dd className="text-foreground font-medium">{set.card_count}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/flashcards/study/?id=${encodeURIComponent(set.id)}`}
            className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex min-h-11 flex-1 items-center justify-center rounded-lg px-4 text-sm font-medium sm:flex-none"
          >
            {t("study")}
          </Link>
          <Link
            href={href}
            className="hover:bg-muted inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border px-4 text-sm font-medium sm:flex-none"
          >
            {t("open")}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
