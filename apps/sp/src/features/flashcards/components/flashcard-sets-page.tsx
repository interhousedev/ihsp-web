"use client"

import { useT } from "@ihsp/i18n"
import { Button, PageContainer, StateView } from "@ihsp/ui"
import { IconPlus } from "@tabler/icons-react"
import { useState } from "react"
import { useFlashcardSets } from "../hooks/use-flashcards"
import { FlashcardSetCard } from "./flashcard-set-card"
import { NewSetDialog } from "./new-set-dialog"

/** `/flashcards/`: all sets with due and new counts (WEB-22). */
export function FlashcardSetsPage() {
  const t = useT("flashcards.list")
  const sets = useFlashcardSets()
  const [dialogOpen, setDialogOpen] = useState(false)

  const newSetButton = (
    <Button type="button" className="min-h-11" onClick={() => setDialogOpen(true)}>
      <IconPlus aria-hidden />
      {t("newSet")}
    </Button>
  )

  return (
    <PageContainer title={t("title")} description={t("description")} actions={newSetButton}>
      {sets.isPending ? <StateView state="loading" rows={3} /> : null}
      {sets.isError ? <StateView state="error" error={sets.error} onRetry={() => void sets.refetch()} /> : null}
      {sets.isSuccess && sets.data.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} action={newSetButton} />
      ) : null}
      {sets.isSuccess && sets.data.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sets.data.map((set) => (
            <li key={set.id}>
              <FlashcardSetCard set={set} />
            </li>
          ))}
        </ul>
      ) : null}
      <NewSetDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </PageContainer>
  )
}
