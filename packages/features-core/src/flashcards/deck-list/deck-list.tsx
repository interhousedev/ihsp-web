"use client"

import type { FlashcardSetItem, FlashcardStats } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
  cn,
} from "@ihsp/ui"
import Link from "next/link"
import { useRef, useState } from "react"
import { ReviewHeatmap } from "../review-heatmap"
import { COUNT_COLORS } from "../utils/count-colors"
import { GetSharedDialog } from "./get-shared-dialog"
import { StudiedToday } from "./studied-today"

export type DeckListProps = {
  decks: readonly FlashcardSetItem[]
  /** Review statistics of all decks; the heatmap and "Studied today" show only when they are given. */
  stats?: FlashcardStats | undefined
  onYearChange?: (year: number) => void
  /** Where a deck's name leads (its overview). */
  getDeckHref: (deckId: string) => string
  onCreateDeck: () => void
  /** Called with the chosen `.txt`, `.csv` or `.tsv` file; leave out to hide "Import file". */
  onImportFile?: (file: File) => void
  /** Called with the share slug of a deck to copy; leave out to hide "Get shared". */
  onGetShared?: (slug: string) => void
  /** The gear menu of a row; a deck has the entries whose callback is given. */
  onDeckOptions?: (deck: FlashcardSetItem) => void
  onDeckEdit?: (deck: FlashcardSetItem) => void
  onDeckDelete?: (deck: FlashcardSetItem) => void
  className?: string
}

function Count({ value, queue }: { value: number; queue: keyof typeof COUNT_COLORS }) {
  return (
    <span className={cn("tabular-nums", value > 0 ? COUNT_COLORS[queue] : "text-muted-foreground/40")}>{value}</span>
  )
}

/**
 * Anki's deck list: a table of decks with the colored New, Learn and Due counts and a gear per row, then today's
 * numbers, the review heatmap and the buttons Get shared, Create deck and Import file.
 */
export function DeckList({
  decks,
  stats,
  onYearChange,
  getDeckHref,
  onCreateDeck,
  onImportFile,
  onGetShared,
  onDeckOptions,
  onDeckEdit,
  onDeckDelete,
  className,
}: DeckListProps) {
  const t = useT("flashcards.deckList")
  const fileInput = useRef<HTMLInputElement>(null)
  const [sharedOpen, setSharedOpen] = useState(false)
  const hasGear = Boolean(onDeckOptions || onDeckEdit || onDeckDelete)
  const buttonClass = "min-h-11 rounded-full px-5 text-xs font-semibold md:min-h-9"

  return (
    <div className={cn("mx-auto flex w-full max-w-3xl flex-col gap-6", className)}>
      {decks.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">{t("empty")}</p>
      ) : (
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-xs font-semibold">
              <th scope="col" className="py-2 ps-2 text-start">
                {t("deck")}
              </th>
              <th scope="col" className="w-14 py-2 text-end">
                {t("new")}
              </th>
              <th scope="col" className="w-14 py-2 text-end">
                {t("learn")}
              </th>
              <th scope="col" className="w-14 py-2 text-end">
                {t("due")}
              </th>
              <th scope="col" className={hasGear ? "w-12" : "w-2"}>
                {hasGear ? <span className="sr-only">{t("options")}</span> : null}
              </th>
            </tr>
          </thead>
          <tbody>
            {decks.map((deck) => (
              <tr key={deck.id} className="hover:bg-muted/60 border-b last:border-b-0">
                <th scope="row" className="min-w-0 py-1 ps-2 text-start font-normal">
                  <div className="flex min-w-0 items-center gap-2">
                    <Link
                      href={getDeckHref(deck.id)}
                      className="flex min-h-11 min-w-0 items-center truncate hover:underline md:min-h-9"
                      title={deck.title}
                    >
                      <span className="truncate">{deck.title}</span>
                    </Link>
                    {deck.source !== "manual" ? (
                      <Badge variant="secondary" className="shrink-0 font-normal">
                        {t(`source.${deck.source}`)}
                      </Badge>
                    ) : null}
                  </div>
                </th>
                <td className="py-1 text-end">
                  <Count value={deck.new_count} queue="new" />
                </td>
                <td className="py-1 text-end">
                  <Count value={deck.learning_count} queue="learning" />
                </td>
                <td className="py-1 text-end">
                  <Count value={deck.due_count} queue="review" />
                </td>
                <td className="py-1 text-end">
                  {hasGear ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground size-11 md:size-8"
                            aria-label={t("deckOptions", { title: deck.title })}
                          />
                        }
                      >
                        <Icons.settings aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {onDeckOptions ? (
                          <DropdownMenuItem className="min-h-11 md:min-h-8" onClick={() => onDeckOptions(deck)}>
                            {t("options")}
                          </DropdownMenuItem>
                        ) : null}
                        {onDeckEdit ? (
                          <DropdownMenuItem className="min-h-11 md:min-h-8" onClick={() => onDeckEdit(deck)}>
                            {t("editCards")}
                          </DropdownMenuItem>
                        ) : null}
                        {onDeckDelete ? (
                          <DropdownMenuItem
                            variant="destructive"
                            className="min-h-11 md:min-h-8"
                            onClick={() => onDeckDelete(deck)}
                          >
                            {t("delete")}
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {stats ? (
        <div className="flex flex-col items-center gap-3">
          <StudiedToday stats={stats} />
          <ReviewHeatmap stats={stats} {...(onYearChange ? { onYearChange } : {})} />
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-2">
        {onGetShared ? (
          <Button type="button" variant="outline" className={buttonClass} onClick={() => setSharedOpen(true)}>
            {t("getShared")}
          </Button>
        ) : null}
        <Button type="button" variant="outline" className={buttonClass} onClick={onCreateDeck}>
          {t("createDeck")}
        </Button>
        {onImportFile ? (
          <>
            <Button type="button" variant="outline" className={buttonClass} onClick={() => fileInput.current?.click()}>
              {t("importFile")}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".txt,.csv,.tsv,text/plain,text/csv,text/tab-separated-values"
              className="hidden"
              data-testid="deck-import-input"
              aria-label={t("importFile")}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (file) onImportFile(file)
              }}
            />
          </>
        ) : null}
      </div>

      {onGetShared ? <GetSharedDialog open={sharedOpen} onOpenChange={setSharedOpen} onSubmit={onGetShared} /> : null}
    </div>
  )
}
