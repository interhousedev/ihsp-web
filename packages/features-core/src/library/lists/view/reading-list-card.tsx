"use client"

import type { ReadingListCard as ReadingListCardData } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Progress, ProgressIndicator, ProgressTrack } from "@ihsp/ui"
import Link from "next/link"
import { listHref } from "../../utils/hrefs"

/** A reading list in a grid: title, subject, owner, entry count and the progress on the essential entries. */
export function ReadingListCardView({ list }: { list: ReadingListCardData }) {
  const t = useT("library.readingList")
  const percent = list.essential_count > 0 ? Math.round((list.essential_done / list.essential_count) * 100) : 0
  return (
    <article className="bg-card focus-within:ring-ring relative flex h-full flex-col gap-2 rounded-xl border p-4 focus-within:ring-2 hover:shadow-sm">
      <h3 className="font-medium break-words">
        <Link href={listHref(list.id)} className="after:absolute after:inset-0 hover:underline">
          {list.title}
        </Link>
      </h3>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {list.subject ? <Badge variant="secondary">{list.subject.name}</Badge> : null}
        {list.year_of_study ? <Badge variant="outline">{t("yearOfStudy", { year: list.year_of_study })}</Badge> : null}
        {list.status !== "published" ? <Badge variant="outline">{t(list.status)}</Badge> : null}
      </div>
      <p className="text-muted-foreground text-xs">
        {t("owner", { name: list.owner.name })} · {t("entries", { count: list.entry_count })}
      </p>
      {list.essential_count > 0 ? (
        <div className="mt-auto flex flex-col gap-1">
          <Progress
            value={percent}
            aria-label={t("progress", { done: list.essential_done, total: list.essential_count })}
          >
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
          <p className="text-muted-foreground text-xs">
            {t("progress", { done: list.essential_done, total: list.essential_count })}
          </p>
        </div>
      ) : null}
    </article>
  )
}
