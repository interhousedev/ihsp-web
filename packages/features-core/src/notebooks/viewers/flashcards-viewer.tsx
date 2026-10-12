"use client"

import type { FlashcardsContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useMemo, useState } from "react"
import { RefChips } from "../chat/ref-chips"
import { downloadText, fileNameFor } from "../lib/download"
import { cardsToCsv, cardsToTsv } from "./cards/deck-export"
import { DeckControls } from "./cards/deck-controls"
import { DeckResults } from "./cards/deck-results"
import { counts, isFinished, queueOf, verdictOf, type RestartMode } from "./cards/deck-state"
import { DeckToolbar } from "./cards/deck-toolbar"
import { FlashcardCard } from "./cards/flashcard-card"
import { SaveSetButton } from "./cards/save-set-button"
import { useDeck } from "./cards/use-deck"
import { useDeckShortcuts } from "./cards/use-deck-shortcuts"
import { ExplainPanel } from "./explain-panel"
import { ViewerProgress } from "./progress-bar"
import { anchorFromRefs } from "./refs-anchor"
import { useCopy } from "./use-copy"
import { useSharedViewer } from "./shared-viewer"
import { useExplain } from "./use-explain"
import { ViewerEmpty } from "./viewer-empty"
import type { ViewerProps } from "./viewer-props"

type Card = FlashcardsContent["cards"][number]

/**
 * A quick deck in the style of NotebookLM (not the spaced-repetition study screen): tap to flip, mark Got it or
 * Missed it, shuffle, delete, restart, hints, "Explain" through the notebook chat, CSV export and the bridge that
 * saves the deck as a normal flash card set.
 */
export function FlashcardsViewer({ notebookId, artifact }: ViewerProps<"flashcards">) {
  const content = artifact.content
  if (!content) return <ViewerEmpty />
  return <FlashcardsBody notebookId={notebookId} artifact={artifact} content={content} />
}

function FlashcardsBody({ notebookId, artifact, content }: ViewerProps<"flashcards"> & { content: FlashcardsContent }) {
  const t = useT("notebooks")
  const copy = useCopy()
  const explain = useExplain(notebookId)
  const shared = useSharedViewer()
  const { deck, actions } = useDeck(notebookId, artifact.id, content.cards, artifact.progress_state)
  const [flippedId, setFlippedId] = useState<string | null>(null)
  const [hinted, setHinted] = useState<ReadonlySet<string>>(() => new Set())

  const byId = useMemo(() => new Map(content.cards.map((card) => [card.id, card])), [content.cards])
  const queue = queueOf(deck)
  const finished = isFinished(deck)
  const currentId = queue[deck.position]
  const card: Card | undefined = !finished && currentId !== undefined ? byId.get(currentId) : undefined
  const flipped = card !== undefined && flippedId === card.id
  const { known, missed, total } = counts(deck)
  const remaining = content.cards.filter((item) => !deck.deleted.includes(item.id))

  const mark = (verdict: "known" | "missed") => {
    if (card) actions.mark(card.id, verdict)
  }
  const restart = (mode: RestartMode) => {
    setFlippedId(null)
    actions.restart(mode)
  }
  useDeckShortcuts({
    enabled: flipped,
    known: () => mark("known"),
    missed: () => mark("missed"),
  })

  const showHint = card !== undefined && hinted.has(card.id) && !flipped && card.hint !== null

  return (
    <section
      aria-label={t("viewers.cards.deck")}
      className="mx-auto flex min-h-full w-full max-w-[600px] flex-col gap-4 p-4 md:p-6"
    >
      {total > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm tabular-nums">
            {t("cards.progress", {
              current: Math.min(deck.position + 1, total),
              total,
            })}
          </p>
          <ViewerProgress
            value={finished ? total : deck.position + 1}
            max={total}
            label={t("cards.progress", {
              current: Math.min(deck.position + 1, total),
              total,
            })}
          />
        </div>
      ) : null}

      {card ? (
        <>
          <FlashcardCard card={card} flipped={flipped} onFlip={() => setFlippedId(flipped ? null : card.id)} />
          <div aria-live="polite" className="min-h-5 text-center text-sm">
            {showHint ? (
              <p>
                <span className="font-medium">{t("cards.hint")}: </span>
                {card.hint}
              </p>
            ) : null}
          </div>
          {flipped ? (
            <div className="text-center">
              <RefChips refs={card.refs} refsIndex={artifact.refs_index} />
            </div>
          ) : null}
          <DeckControls
            flipped={flipped}
            verdict={verdictOf(deck, card.id)}
            canPrevious={deck.position > 0}
            canNext={deck.position < total - 1}
            onPrevious={() => actions.move(-1)}
            onNext={() => actions.move(1)}
            onKnown={() => mark("known")}
            onMissed={() => mark("missed")}
          />
        </>
      ) : null}
      {finished ? <DeckResults known={known} missed={missed} onRestart={restart} /> : null}
      {total === 0 ? (
        <p className="text-muted-foreground flex-1 py-12 text-center text-sm">{t("viewers.cards.empty")}</p>
      ) : null}

      <DeckToolbar
        hasCard={card !== undefined}
        canHint={card !== undefined && card.hint !== null && !hinted.has(card.id)}
        canRestart={total > 0}
        hasCards={remaining.length > 0}
        onShuffle={actions.shuffle}
        onDelete={() => card && actions.remove(card.id)}
        onRestart={() => restart("same")}
        onHint={() => card && setHinted((current) => new Set(current).add(card.id))}
        onExplain={
          shared
            ? undefined
            : () => {
                if (!card) return
                explain.start({
                  text: t("viewers.cards.explainPrompt", { text: card.front }),
                  heading: card.front,
                  anchor: anchorFromRefs(card.refs, artifact.refs_index),
                })
              }
        }
        onCsv={() => downloadText(fileNameFor(content.title, "csv"), cardsToCsv(remaining), "text/csv;charset=utf-8")}
        onCopy={() => void copy(cardsToTsv(remaining))}
        bridge={
          shared ? null : (
            <SaveSetButton notebookId={notebookId} artifactId={artifact.id} setId={artifact.flashcard_set_id} />
          )
        }
      />
      <ExplainPanel explain={explain} />
    </section>
  )
}
