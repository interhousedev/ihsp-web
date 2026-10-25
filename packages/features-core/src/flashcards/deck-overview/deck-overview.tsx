"use client"

import type { FlashcardStats } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, buttonVariants, cn, Icons, ICON_SIZES, IconBulb, IconSparkles, IconClockHour4 } from "@ihsp/ui"
import Link from "next/link"
import { ReviewHeatmap } from "../review-heatmap"
import { COUNT_COLORS, type CountQueue } from "../utils/count-colors"

export type DeckOverviewProps = {
  title: string
  description?: string | null | undefined
  /** The numbers of Anki's overview, after the daily limits. */
  counts: { new: number; learning: number; review: number }
  cardCount: number
  /** Review statistics of this deck; the heatmap shows only when they are given. */
  stats?: FlashcardStats | undefined
  onYearChange?: (year: number) => void
  studyHref: string
  /** The buttons at the bottom; a button shows when its callback is given. */
  onOptions?: () => void
  onEditCards?: () => void
  onDescription?: () => void
  onShare?: () => void
  className?: string
}

const QUEUES: readonly { queue: CountQueue; label: "new" | "learning" | "toReview"; icon: typeof IconSparkles }[] = [
  { queue: "new", label: "new", icon: IconSparkles },
  { queue: "learning", label: "learning", icon: IconBulb },
  { queue: "review", label: "toReview", icon: IconClockHour4 },
]

/**
 * Anki's deck overview: the title and description, the New, Learning and To Review counts, a big "Study now" button,
 * the review heatmap and the buttons Options, Edit cards, Description and Share.
 */
export function DeckOverview({
  title,
  description,
  counts,
  cardCount,
  stats,
  onYearChange,
  studyHref,
  onOptions,
  onEditCards,
  onDescription,
  onShare,
  className,
}: DeckOverviewProps) {
  const t = useT("flashcards.overview")
  const nothingToStudy = counts.new + counts.learning + counts.review === 0
  const buttonClass = "min-h-11 gap-2 rounded-full bg-muted/60 px-4 text-sm font-medium md:min-h-9"
  const bottom = [
    { key: "options", label: t("options"), icon: Icons.settings, onClick: onOptions },
    { key: "editCards", label: t("editCards"), icon: Icons.edit, onClick: onEditCards },
    { key: "description", label: t("description"), icon: Icons.post, onClick: onDescription },
    { key: "share", label: t("share"), icon: Icons.share, onClick: onShare },
  ].filter((item) => item.onClick)

  return (
    <div className={cn("mx-auto flex w-full max-w-3xl flex-col items-center gap-6", className)}>
      <header className="flex max-w-full flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight break-words md:text-3xl">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-prose text-sm break-words whitespace-pre-line">{description}</p>
        ) : null}
        <p className="text-muted-foreground text-xs">{t("cardCount", { count: cardCount })}</p>
      </header>

      <dl className="grid w-full max-w-56 grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm" aria-label={t("countsLabel")}>
        {QUEUES.map(({ queue, label, icon: QueueIcon }) => (
          <div key={queue} className="col-span-2 grid grid-cols-subgrid">
            <dt className="flex items-center gap-1.5">
              <QueueIcon size={ICON_SIZES.sm} stroke={1.75} className={COUNT_COLORS[queue]} aria-hidden />
              {t(label)}:
            </dt>
            <dd className={cn("text-end font-semibold tabular-nums", COUNT_COLORS[queue])} data-queue={queue}>
              {counts[queue]}
            </dd>
          </div>
        ))}
      </dl>

      {nothingToStudy ? (
        <p role="status" className="bg-muted max-w-md rounded-lg border px-4 py-3 text-center text-sm">
          {cardCount === 0 ? t("noCards") : t("finished")}
        </p>
      ) : (
        <Link
          href={studyHref}
          className={cn(buttonVariants({ size: "lg" }), "h-12 w-full max-w-md rounded-xl text-sm font-semibold")}
        >
          {t("studyNow")}
        </Link>
      )}

      {stats ? <ReviewHeatmap stats={stats} {...(onYearChange ? { onYearChange } : {})} /> : null}

      {bottom.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2">
          {bottom.map((item) => (
            <Button key={item.key} type="button" variant="outline" className={buttonClass} onClick={item.onClick}>
              <item.icon size={ICON_SIZES.sm} stroke={1.75} aria-hidden />
              {item.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
