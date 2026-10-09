"use client"

import type { ReadingListDetail, ReadingListEntry } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Progress, ProgressIndicator, ProgressTrack, buttonVariants } from "@ihsp/ui"
import { IconExternalLink, IconPencil } from "@tabler/icons-react"
import Link from "next/link"
import { useState } from "react"
import { ImportanceBadge } from "../../catalog/importance-badge"
import { ShelfButton } from "../../catalog/shelf-button"
import { SourceTag } from "../../catalog/source-tag"
import { useUniLibraryEnabled } from "../../hooks/use-uni-library"
import { itemHref, listEditHref } from "../../utils/hrefs"
import {
  essentialProgress,
  groupByImportance,
  groupByWeek,
  hasWeekLabels,
  type EntryGroup,
} from "./reading-list-entries"

function EntryRow({ entry }: { entry: ReadingListEntry }) {
  const t = useT("library.readingList")
  const format = useFormatters()
  const uniLibrary = useUniLibraryEnabled()
  const card = entry.item
  // A UniLibrary entry is invisible while UniLibrary is off, like every other UniLibrary part.
  if (card?.kind === "external" && !uniLibrary) return null

  const title = card?.title ?? entry.title ?? entry.url ?? ""
  const pages =
    entry.page_from !== null ? t("pages", { from: entry.page_from, to: entry.page_to ?? entry.page_from }) : null
  const href = card ? (card.id || card.slug ? itemHref((card.id ?? card.slug)!) : null) : null
  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <ImportanceBadge importance={entry.importance} />
            {card ? <SourceTag source={card.tag.source} /> : null}
          </div>
          {href ? (
            <Link href={href} className="font-medium break-words hover:underline">
              {title}
            </Link>
          ) : entry.url ? (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium break-words hover:underline"
            >
              {title}
              <IconExternalLink className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">{t("openLink")}</span>
            </a>
          ) : (
            <span className="font-medium break-words">{title}</span>
          )}
          {card?.author_label ? <span className="text-muted-foreground text-xs">{card.author_label}</span> : null}
        </div>
        {card && (card.id || card.external) ? <ShelfButton item={card} /> : null}
      </div>
      {pages || entry.due_on ? (
        <p className="text-muted-foreground text-xs">
          {pages}
          {pages && entry.due_on ? " · " : ""}
          {entry.due_on ? t("due", { date: format.date(entry.due_on) }) : ""}
        </p>
      ) : null}
      {entry.note ? <p className="text-sm whitespace-pre-line">{entry.note}</p> : null}
    </li>
  )
}

function Group({ group }: { group: EntryGroup }) {
  const t = useT("library.readingList")
  const importance = useT("library.importance")
  const heading = group.importance ? importance(group.importance) : (group.label ?? t("otherWeek"))
  return (
    <section aria-label={heading} className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{heading}</h2>
      <ul className="flex flex-col gap-2">
        {group.entries.map((entry) => (
          <EntryRow key={entry.position} entry={entry} />
        ))}
      </ul>
    </section>
  )
}

/** A reading list: header, progress on the essential entries and the entries grouped by importance or by week. */
export function ReadingListView({ list }: { list: ReadingListDetail }) {
  const t = useT("library.readingList")
  const [byWeek, setByWeek] = useState(() => hasWeekLabels(list.entries))
  const progress = essentialProgress(list.entries)
  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0
  const groups = byWeek ? groupByWeek(list.entries) : groupByImportance(list.entries)
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-4 pb-8 md:px-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight break-words md:text-3xl">{list.title}</h1>
          {list.can_edit ? (
            <Link
              href={listEditHref(list.id)}
              className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
            >
              <IconPencil aria-hidden />
              {t("edit")}
            </Link>
          ) : null}
        </div>
        {list.description ? <p className="text-muted-foreground text-sm">{list.description}</p> : null}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {list.subject ? <Badge variant="secondary">{list.subject.name}</Badge> : null}
          {list.year_of_study ? (
            <Badge variant="outline">{t("yearOfStudy", { year: list.year_of_study })}</Badge>
          ) : null}
          {list.term_half ? <Badge variant="outline">{t("term", { half: list.term_half })}</Badge> : null}
          {list.status !== "published" ? <Badge variant="outline">{t(list.status)}</Badge> : null}
          <span className="text-muted-foreground">{t("owner", { name: list.owner.name })}</span>
        </div>
      </header>

      <div className="flex flex-col gap-1">
        {progress.total > 0 ? (
          <>
            <Progress value={percent} aria-label={t("progress", { done: progress.done, total: progress.total })}>
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
            </Progress>
            <p className="text-muted-foreground text-xs">
              {t("progress", { done: progress.done, total: progress.total })}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-xs">{t("noEssential")}</p>
        )}
      </div>

      {hasWeekLabels(list.entries) ? (
        <div role="group" aria-label={t("groupBy")} className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{t("groupBy")}</span>
          <Button
            type="button"
            size="sm"
            variant={byWeek ? "outline" : "default"}
            aria-pressed={!byWeek}
            className="min-h-11 md:min-h-8"
            onClick={() => setByWeek(false)}
          >
            {t("byImportance")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={byWeek ? "default" : "outline"}
            aria-pressed={byWeek}
            className="min-h-11 md:min-h-8"
            onClick={() => setByWeek(true)}
          >
            {t("byWeek")}
          </Button>
        </div>
      ) : null}

      {groups.map((group) => (
        <Group key={group.key} group={group} />
      ))}
    </div>
  )
}
