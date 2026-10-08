"use client"

import type { StepView } from "@ihsp/api"
import { StudyScreen } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Card, CardContent, StateView } from "@ihsp/ui"
import { useCardStudy } from "../hooks/use-card-study"

type FlashcardsBlockData = Extract<StepView["blocks"][number], { type: "flashcards" }>

/**
 * A flash card block: a mini study session on Anki's study screen (new + learning + review counts, Again / Hard /
 * Good / Easy with the next interval above each; UF-LMS-03, LMS-18). Staff previewing a draft only see how many cards
 * there are, because studying keeps per-student progress.
 */
export function FlashcardsBlock({
  stepId,
  block,
  readOnly,
}: {
  stepId: string
  block: FlashcardsBlockData
  readOnly: boolean
}) {
  const t = useT("cards")
  const errorMessage = useErrorMessage()
  const study = useCardStudy(stepId, block.id, !readOnly)

  if (readOnly) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-1">
          <h3 className="text-base font-semibold">{t("title")}</h3>
          <p className="text-muted-foreground text-sm">{t("count", { count: block.cards_count })}</p>
          <p className="text-muted-foreground text-xs">{t("previewNote")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">{t("title")}</h3>

        {study.next.isPending ? <StateView state="loading" rows={1} /> : null}
        {study.next.isError && !study.next.data ? (
          <StateView state="error" error={study.next.error} onRetry={() => void study.next.refetch()} />
        ) : null}

        {study.next.data ? (
          <StudyScreen
            variant="embedded"
            card={study.card}
            intervals={study.intervals}
            counts={study.counts}
            reviewed={study.reviewed}
            isRating={study.isRating}
            error={study.ratingFailed ? errorMessage(study.ratingError) : undefined}
            onRate={study.rate}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
