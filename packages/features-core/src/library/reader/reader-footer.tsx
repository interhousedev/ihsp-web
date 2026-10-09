"use client"

import { useT } from "@ihsp/i18n"
import { Button, Progress, ProgressIndicator, ProgressTrack } from "@ihsp/ui"
import { IconBookmark, IconBookmarkFilled, IconChevronLeft, IconChevronRight, IconHighlight } from "@tabler/icons-react"
import type { ReaderPosition } from "./reader-types"

export type ReaderFooterProps = {
  position: ReaderPosition | null
  pages: number | null
  onPrev(): void
  onNext(): void
  /** Opens "Go to page" (formats with pages). */
  onGoTo: (() => void) | null
  /** `null` hides the bookmark button (visitors). */
  bookmarked: boolean | null
  onBookmark(): void
  onNotes(): void
}

const ICON_BUTTON = "size-11 md:size-8"

/** The bottom bar: progress, previous and next, the place ("Page 3 of 120" or the percent), bookmark and notes. */
export function ReaderFooter({
  position,
  pages,
  onPrev,
  onNext,
  onGoTo,
  bookmarked,
  onBookmark,
  onNotes,
}: ReaderFooterProps) {
  const t = useT("library.reader")
  const percent = Math.round((position?.fraction ?? 0) * 100)
  const label =
    position?.locator && "page" in position.locator && pages !== null
      ? t("page", { page: position.locator.page, pages })
      : position?.label
        ? `${position.label} · ${t("percent", { percent })}`
        : t("percent", { percent })
  return (
    <footer className="bg-background shrink-0 border-t pb-[var(--safe-bottom,0px)]">
      <Progress value={percent} aria-label={t("progress")} className="gap-0">
        <ProgressTrack className="h-1 rounded-none">
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
      <div className="flex items-center justify-between gap-1 px-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("previous")}
          className={ICON_BUTTON}
          onClick={onPrev}
        >
          <IconChevronLeft aria-hidden />
        </Button>
        {bookmarked !== null ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={bookmarked ? t("removeBookmark") : t("addBookmark")}
            aria-pressed={bookmarked}
            className={ICON_BUTTON}
            onClick={onBookmark}
          >
            {bookmarked ? <IconBookmarkFilled aria-hidden /> : <IconBookmark aria-hidden />}
          </Button>
        ) : null}
        {onGoTo ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 flex-1 truncate tabular-nums md:min-h-8"
            onClick={onGoTo}
          >
            {label}
          </Button>
        ) : (
          <p role="status" className="text-muted-foreground min-w-0 flex-1 truncate text-center text-sm tabular-nums">
            {label}
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("notes")}
          className={`${ICON_BUTTON} md:hidden`}
          onClick={onNotes}
        >
          <IconHighlight aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("next")}
          className={ICON_BUTTON}
          onClick={onNext}
        >
          <IconChevronRight aria-hidden />
        </Button>
      </div>
    </footer>
  )
}
