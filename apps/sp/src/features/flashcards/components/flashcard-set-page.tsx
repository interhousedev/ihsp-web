"use client"

import { DeckOverview, ShareDialog } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { ConfirmDialog, Icons, PageContainer, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useDeleteFlashcardSet, useFlashcardSet, useFlashcardStats } from "../hooks/use-flashcards"
import { editHref, studyHref } from "../utils/hrefs"
import { DescriptionDialog } from "./description-dialog"
import { SetOptionsDialog } from "./set-options-dialog"

/** `/flashcards/set/?id=`: Anki's deck overview with its counts, Study now, heatmap, Options, Edit cards and Description. */
export function FlashcardSetPage() {
  const t = useT("flashcards.page")
  const router = useRouter()
  const params = useSearchParams()
  const id = params.get("id")
  const deck = useFlashcardSet(id)
  const [year, setYear] = useState<number | null>(null)
  const stats = useFlashcardStats(id, year, id !== null)
  const remove = useDeleteFlashcardSet()
  const [optionsOpen, setOptionsOpen] = useState(params.get("options") === "1")
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (id === null) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="empty" emptyText={t("missing")} />
      </PageContainer>
    )
  }
  if (deck.isPending) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="loading" rows={4} />
      </PageContainer>
    )
  }
  if (deck.isError) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="error" error={deck.error} onRetry={() => void deck.refetch()} />
      </PageContainer>
    )
  }

  const detail = deck.data
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 px-4 pt-2 pb-6 md:px-6 md:pt-4">
      <Link
        href="/flashcards/"
        className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center gap-1 self-start text-sm"
      >
        <Icons.chevronLeft className="size-4" aria-hidden />
        {t("allDecks")}
      </Link>
      <DeckOverview
        title={detail.title}
        description={detail.description}
        counts={{ new: detail.new_count, learning: detail.learning_count, review: detail.due_count }}
        cardCount={detail.card_count}
        stats={stats.data}
        onYearChange={setYear}
        studyHref={studyHref(detail.id)}
        onOptions={() => setOptionsOpen(true)}
        onEditCards={() => router.push(editHref(detail.id))}
        onDescription={() => setDescriptionOpen(true)}
        onShare={() => setShareOpen(true)}
      />

      <SetOptionsDialog
        deck={detail}
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        onDelete={() => {
          setOptionsOpen(false)
          setConfirmDelete(true)
        }}
      />
      <DescriptionDialog deck={detail} open={descriptionOpen} onOpenChange={setDescriptionOpen} />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} kind="flashcard_set" targetId={detail.id} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription", { title: detail.title })}
        confirmLabel={t("deleteConfirm")}
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(detail.id, {
            onSuccess: () => router.replace("/flashcards/"),
            onError: () => toast.error(t("deleteFailed")),
          })
        }
      />
    </div>
  )
}
