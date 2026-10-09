"use client"

import type { FlashcardsContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useId } from "react"
import { CardFace } from "./card-face"

type FlashcardCardProps = {
  card: FlashcardsContent["cards"][number]
  flipped: boolean
  onFlip: () => void
}

/**
 * The card: one button that turns over (CSS 3D, instant under reduced motion). Enter and Space flip it like any
 * button; both faces stay in the accessibility tree and the face turned away is `aria-hidden`.
 */
export function FlashcardCard({ card, flipped, onFlip }: FlashcardCardProps) {
  const t = useT("notebooks")
  const captionId = useId()
  return (
    <div className="flex flex-1 flex-col gap-2 md:flex-none">
      <div className="flex flex-1 [perspective:1200px] md:flex-none">
        <button
          type="button"
          onClick={onFlip}
          title={t("cards.flip")}
          aria-describedby={captionId}
          className="focus-visible:ring-ring/50 relative block min-h-64 w-full flex-1 cursor-pointer rounded-2xl outline-hidden focus-visible:ring-3 md:aspect-[3/2] md:min-h-0 md:flex-none"
        >
          <span
            className={cn(
              "absolute inset-0 block transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none",
              flipped && "[transform:rotateY(180deg)]",
            )}
          >
            <CardFace side="front" text={card.front} topic={card.topic} hidden={flipped} />
            <CardFace side="back" text={card.back} hidden={!flipped} />
          </span>
        </button>
      </div>
      <p id={captionId} className="text-muted-foreground text-center text-xs">
        {t("viewers.cards.tapToFlip")}
      </p>
    </div>
  )
}
