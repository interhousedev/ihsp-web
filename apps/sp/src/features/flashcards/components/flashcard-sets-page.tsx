"use client"

import type { FlashcardSetItem } from "@ihsp/api"
import { DeckList, detectSeparator, parseImport } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { ConfirmDialog, PageContainer, StateView } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
  useCreateFlashcardSet,
  useDeleteFlashcardSet,
  useFlashcardSets,
  useFlashcardStats,
} from "../hooks/use-flashcards"
import { deckHref, editHref, optionsHref } from "../utils/hrefs"

const TITLE_MAX = 200

/** The file name without its extension: the title of a deck imported from it. */
function titleFromFile(name: string): string {
  return (name.replace(/\.[^.]+$/, "").trim() || name).slice(0, TITLE_MAX)
}

/** `/flashcards/`: Anki's deck list with New, Learn and Due counts, today's numbers and the review heatmap (WEB-22). */
export function FlashcardSetsPage() {
  const t = useT("flashcards.page")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const decks = useFlashcardSets()
  const [year, setYear] = useState<number | null>(null)
  const stats = useFlashcardStats(null, year)
  const create = useCreateFlashcardSet()
  const remove = useDeleteFlashcardSet()
  const [deleting, setDeleting] = useState<FlashcardSetItem | null>(null)

  async function importFile(file: File) {
    try {
      const text = await file.text()
      const { cards } = parseImport(text, detectSeparator(text))
      if (cards.length === 0) {
        toast.error(t("importEmpty"))
        return
      }
      create.mutate(
        { title: titleFromFile(file.name), cards },
        {
          onSuccess: (deck) => {
            toast.success(t("imported", { count: deck.card_count, title: deck.title }))
            router.push(deckHref(deck.id))
          },
          onError: (error) => toast.error(errorMessage(error)),
        },
      )
    } catch {
      toast.error(t("importFailed"))
    }
  }

  return (
    <PageContainer title={t("title")} description={t("description")}>
      {decks.isPending ? <StateView state="loading" rows={3} /> : null}
      {decks.isError ? <StateView state="error" error={decks.error} onRetry={() => void decks.refetch()} /> : null}
      {decks.isSuccess ? (
        <DeckList
          decks={decks.data}
          stats={stats.data}
          onYearChange={setYear}
          getDeckHref={deckHref}
          onCreateDeck={() => router.push("/flashcards/edit/")}
          onImportFile={(file) => void importFile(file)}
          onGetShared={(slug) => router.push(`/flashcards/copy/?share=${encodeURIComponent(slug)}`)}
          onDeckOptions={(deck) => router.push(optionsHref(deck.id))}
          onDeckEdit={(deck) => router.push(editHref(deck.id))}
          onDeckDelete={setDeleting}
        />
      ) : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription", { title: deleting?.title ?? "" })}
        confirmLabel={t("deleteConfirm")}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          remove.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
            onError: () => toast.error(t("deleteFailed")),
          })
        }}
      />
    </PageContainer>
  )
}
