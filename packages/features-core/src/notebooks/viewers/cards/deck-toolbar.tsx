"use client"

import { useT } from "@ihsp/i18n"
import {
  IconArrowsShuffle,
  IconBulb,
  IconCopy,
  IconDownload,
  IconMessageQuestion,
  IconRefresh,
  IconTrash,
} from "@ihsp/ui"
import type { ReactNode } from "react"
import { ToolbarButton } from "../toolbar-button"

type DeckToolbarProps = {
  /** There is a card on the screen (not the results, not an empty deck). */
  hasCard: boolean
  /** The current card has a hint that was not shown yet. */
  canHint: boolean
  canRestart: boolean
  hasCards: boolean
  onShuffle: () => void
  onDelete: () => void
  onRestart: () => void
  onHint: () => void
  onExplain: () => void
  onCsv: () => void
  onCopy: () => void
  /** The "Save as flash card set" button or the "Open set" link. */
  bridge: ReactNode
}

/** Shuffle, Delete card, Restart, Hint, Explain, Download CSV, Copy and the set bridge. Icons only on phones. */
export function DeckToolbar({
  hasCard,
  canHint,
  canRestart,
  hasCards,
  onShuffle,
  onDelete,
  onRestart,
  onHint,
  onExplain,
  onCsv,
  onCopy,
  bridge,
}: DeckToolbarProps) {
  const t = useT("notebooks")
  return (
    <div role="group" aria-label={t("viewers.cards.tools")} className="flex flex-wrap justify-center gap-2">
      <ToolbarButton
        compact
        icon={IconArrowsShuffle}
        label={t("cards.shuffle")}
        disabled={!hasCard}
        onClick={onShuffle}
      />
      <ToolbarButton compact icon={IconTrash} label={t("cards.delete")} disabled={!hasCard} onClick={onDelete} />
      <ToolbarButton compact icon={IconRefresh} label={t("cards.restart")} disabled={!canRestart} onClick={onRestart} />
      <ToolbarButton compact icon={IconBulb} label={t("cards.hint")} disabled={!canHint} onClick={onHint} />
      <ToolbarButton
        compact
        icon={IconMessageQuestion}
        label={t("cards.explain")}
        disabled={!hasCard}
        onClick={onExplain}
      />
      <ToolbarButton compact icon={IconDownload} label={t("cards.csv")} disabled={!hasCards} onClick={onCsv} />
      <ToolbarButton compact icon={IconCopy} label={t("viewers.cards.copy")} disabled={!hasCards} onClick={onCopy} />
      {bridge}
    </div>
  )
}
