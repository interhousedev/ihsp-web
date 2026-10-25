"use client"

import type { Annotation } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Skeleton, buttonVariants, cn } from "@ihsp/ui"
import { IconBookmark, IconFileExport, IconHighlight, IconPencil } from "@ihsp/ui"
import Link from "next/link"
import { COLOR_BORDER, COLOR_ICONS, COLOR_TEXT } from "../lib/colors"
import { isPageLocator, locatorToHrefParams } from "../lib/locator"
import { itemHref, readHref } from "../../utils/hrefs"

export type NoteGroupProps = {
  itemId: string
  /** The item's title; `undefined` while it loads. */
  title: string | undefined
  /** The item cannot be opened any more (removed, or not visible to the user). */
  unavailable: boolean
  notes: readonly Annotation[]
  exporting: boolean
  onExport(): void
}

function KindIcon({ kind }: { kind: Annotation["kind"] }) {
  const Icon = kind === "bookmark" ? IconBookmark : kind === "note" ? IconPencil : IconHighlight
  return <Icon className="size-4" aria-hidden />
}

/** All notes of one item: its title (a link), the notes newest first, and each note's link into the reader. */
export function NoteGroup({ itemId, title, unavailable, notes, exporting, onExport }: NoteGroupProps) {
  const t = useT("library.notes")
  const annotationT = useT("library.annotation")
  const { date } = useFormatters()
  return (
    <section aria-label={title ?? t("loadingItem")} className="bg-card flex flex-col gap-3 rounded-xl border p-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        {title === undefined && !unavailable ? (
          <Skeleton className="h-5 w-48" />
        ) : unavailable ? (
          <h3 className="text-muted-foreground font-medium">{t("unavailable")}</h3>
        ) : (
          <h3 className="font-medium break-words">
            <Link href={itemHref(itemId)} className="hover:underline">
              {title}
            </Link>
          </h3>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11 md:min-h-7"
          disabled={exporting}
          onClick={onExport}
        >
          <IconFileExport aria-hidden />
          {t("exportItem")}
        </Button>
      </header>
      <ul className="flex flex-col gap-3">
        {notes.map((note) => {
          const Icon = COLOR_ICONS[note.color]
          const place = isPageLocator(note.locator)
            ? annotationT("page", { page: note.locator.page })
            : annotationT("percent", { percent: Math.round(note.locator.progress * 100) })
          return (
            <li key={note.id} className="flex flex-col gap-1.5">
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                <Icon className={cn("size-3.5", COLOR_TEXT[note.color])} aria-hidden />
                <KindIcon kind={note.kind} />
                <span>{annotationT(`kind.${note.kind}`)}</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">{place}</span>
                <span aria-hidden>·</span>
                <time dateTime={note.updated_at}>{date(note.updated_at)}</time>
              </div>
              {note.quote ? (
                <blockquote className={cn("border-s-4 ps-3 text-sm", COLOR_BORDER[note.color])}>
                  <span className="break-words">{note.quote}</span>
                </blockquote>
              ) : null}
              {note.note ? <p className="text-sm break-words whitespace-pre-wrap">{note.note}</p> : null}
              {unavailable ? null : (
                <Link
                  href={readHref({ item: note.item_id, file: note.file_id, ...locatorToHrefParams(note.locator) })}
                  className={buttonVariants({
                    variant: "link",
                    size: "sm",
                    className: "min-h-11 self-start px-0 md:min-h-7",
                  })}
                >
                  {t("open")}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
