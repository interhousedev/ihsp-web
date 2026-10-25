"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconTrophy } from "@ihsp/ui"
import type { RestartMode } from "./deck-state"

type DeckResultsProps = {
  known: number
  missed: number
  onRestart: (mode: RestartMode) => void
}

/** Shown when every card of the round is marked: the counts and the three ways to go again. */
export function DeckResults({ known, missed, onRestart }: DeckResultsProps) {
  const t = useT("notebooks")
  return (
    <div className="bg-card flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border p-6 text-center md:aspect-[3/2] md:flex-none">
      <IconTrophy aria-hidden className="text-primary size-10" />
      <p role="status" className="text-lg font-semibold">
        {t("cards.results", { known, missed })}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" className="min-h-11" onClick={() => onRestart("same")}>
          {t("cards.again.same")}
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={() => onRestart("all")}>
          {t("cards.again.all")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={missed === 0}
          onClick={() => onRestart("missed")}
        >
          {t("cards.again.missed")}
        </Button>
      </div>
    </div>
  )
}
