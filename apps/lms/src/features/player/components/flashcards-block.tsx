"use client"

import {
  getLmsStepCardsNextQuery,
  keys,
  postLmsStepCardReview,
  type LmsCardStudy,
  type ReviewRating,
  type StepView,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Card, CardContent, Markdown, StateView } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

type FlashcardsBlockData = Extract<StepView["blocks"][number], { type: "flashcards" }>

const RATINGS: readonly ReviewRating[] = ["again", "hard", "medium", "easy"]

/**
 * A flash card block: a mini study session with Again / Hard / Medium / Easy (UF-LMS-03, LMS-18). Staff previewing a
 * draft only see how many cards there are, because studying keeps per-student progress.
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
  const queryClient = useQueryClient()
  const [revealedId, setRevealedId] = useState<string | null>(null)
  const next = useQuery({ ...getLmsStepCardsNextQuery(stepId, block.id), enabled: !readOnly, staleTime: 0 })

  const review = useMutation<LmsCardStudy, unknown, { cardId: string; rating: ReviewRating }>({
    mutationFn: ({ cardId, rating }) => postLmsStepCardReview(stepId, cardId, { rating }),
    onSuccess: (study) => {
      queryClient.setQueryData(keys.lms.cardNext(stepId, block.id), study)
      setRevealedId(null)
    },
  })

  const card = next.data?.card ?? null
  const revealed = card !== null && revealedId === card.id

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">{t("title")}</h3>
          {next.data ? (
            <p className="text-muted-foreground text-xs tabular-nums">
              {t("counts", {
                new: next.data.counts.new,
                learning: next.data.counts.learning,
                review: next.data.counts.review,
              })}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">{t("count", { count: block.cards_count })}</p>
          )}
        </div>

        {next.isPending ? <StateView state="loading" rows={1} /> : null}
        {next.isError && !next.data ? (
          <StateView state="error" error={next.error} onRetry={() => void next.refetch()} />
        ) : null}

        {next.data && card === null ? <p className="text-muted-foreground text-sm">{t("done")}</p> : null}

        {card ? (
          <div className="flex flex-col gap-3">
            <div className="bg-muted/40 flex min-h-32 flex-col justify-center gap-3 rounded-lg border p-4">
              <Markdown className="text-base">{card.front}</Markdown>
              {revealed ? (
                <>
                  <hr className="border-border" />
                  <Markdown className="text-base">{card.back}</Markdown>
                </>
              ) : null}
            </div>
            {revealed ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RATINGS.map((rating) => (
                  <Button
                    key={rating}
                    variant={rating === "again" ? "destructive" : "outline"}
                    disabled={review.isPending}
                    onClick={() => review.mutate({ cardId: card.id, rating })}
                    className="h-auto min-h-11 flex-col gap-0 py-1.5"
                  >
                    <span>{t(`ratings.${rating}`)}</span>
                    {next.data?.intervals ? (
                      <span className="text-muted-foreground text-xs font-normal">{next.data.intervals[rating]}</span>
                    ) : null}
                  </Button>
                ))}
              </div>
            ) : (
              <Button onClick={() => setRevealedId(card.id)} className="min-h-11 md:min-h-8">
                {t("showAnswer")}
              </Button>
            )}
          </div>
        ) : null}

        {review.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(review.error)}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
