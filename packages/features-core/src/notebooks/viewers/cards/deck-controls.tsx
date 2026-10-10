"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconCheck, IconChevronLeft, IconChevronRight, IconX } from "@ihsp/ui"
import type { Verdict } from "./deck-state"

type DeckControlsProps = {
  flipped: boolean
  /** The mark the current card already has. */
  verdict: Verdict | null
  canPrevious: boolean
  canNext: boolean
  onPrevious: () => void
  onNext: () => void
  onKnown: () => void
  onMissed: () => void
}

/** Missed it / Got it (after the card is flipped) and Previous / Next. */
export function DeckControls({
  flipped,
  verdict,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  onKnown,
  onMissed,
}: DeckControlsProps) {
  const t = useT("notebooks")
  const common = useT()
  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-12 gap-2">
        {flipped ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="border-destructive/40 text-destructive hover:text-destructive min-h-12 flex-1 gap-2"
              onClick={onMissed}
            >
              <IconX aria-hidden />
              {t("cards.missed")}
            </Button>
            <Button type="button" className="min-h-12 flex-1 gap-2" onClick={onKnown}>
              <IconCheck aria-hidden />
              {t("cards.known")}
            </Button>
          </>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" className="min-h-11 gap-1" disabled={!canPrevious} onClick={onPrevious}>
          <IconChevronLeft aria-hidden className="rtl:rotate-180" />
          {common("common.previous")}
        </Button>
        {verdict ? (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            {verdict === "known" ? (
              <IconCheck aria-hidden className="size-3.5" />
            ) : (
              <IconX aria-hidden className="size-3.5" />
            )}
            {verdict === "known" ? t("cards.known") : t("cards.missed")}
          </span>
        ) : null}
        <Button type="button" variant="ghost" className="min-h-11 gap-1" disabled={!canNext} onClick={onNext}>
          {common("common.next")}
          <IconChevronRight aria-hidden className="rtl:rotate-180" />
        </Button>
      </div>
    </div>
  )
}
