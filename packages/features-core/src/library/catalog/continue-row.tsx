"use client"

import type { ItemCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Progress, ProgressIndicator, ProgressTrack } from "@ihsp/ui"
import Link from "next/link"
import { readHref } from "../utils/hrefs"
import { cardKey, cardRouteId } from "./card-utils"
import { CoverImage } from "./cover-image"

/** "Continue reading": compact rows (cover, title, percent) that open the reader where the user stopped. */
export function ContinueRow({ items }: { items: readonly ItemCard[] }) {
  const t = useT("library.home")
  if (items.length === 0) return null
  return (
    <section aria-labelledby="continue-title" className="flex flex-col gap-3">
      <h2 id="continue-title" className="text-lg font-semibold">
        {t("continue")}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const id = cardRouteId(item)
          if (!id) return null
          return (
            <li key={cardKey(item)}>
              <Link
                href={readHref({ item: id })}
                className="bg-card hover:bg-muted/50 focus-visible:ring-ring flex min-h-20 items-center gap-3 rounded-xl border p-3 focus-visible:ring-2"
              >
                <CoverImage src={item.cover_url} className="h-16 w-12 shrink-0 rounded" />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="line-clamp-2 text-sm font-medium break-words">{item.title}</span>
                  <Progress value={item.progress_percent ?? 0} aria-label={item.title}>
                    <ProgressTrack>
                      <ProgressIndicator />
                    </ProgressTrack>
                  </Progress>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {Math.round(item.progress_percent ?? 0)}%
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
