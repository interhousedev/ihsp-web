"use client"

import {
  getLmsEngagementReviewQuery,
  keys,
  postLmsEngagementReviewAnswer,
  postLmsEngagementReviewGrade,
  type Answer,
  type ReviewAnswerResult,
  type ReviewGradeRating,
  type ReviewList,
} from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Card, CardContent, PageContainer, Progress } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { LinkButton } from "../../shared/components/link-button"
import { StepikScope } from "../../shared/components/stepik-scope"
import { hrefs } from "../../shared/utils/hrefs"
import { percent } from "../utils/engagement"
import { ReviewCard } from "./review-card"

function Session({ list }: { list: ReviewList }) {
  const t = useT("engagement")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  // The session works on the list it started with; answering does not refetch it under the learner.
  const [items] = useState(list.items)
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<ReviewAnswerResult | null>(null)
  const [stats, setStats] = useState({ correct: 0, xp: 0 })

  function advance() {
    setResult(null)
    setIndex((value) => value + 1)
  }

  const answer = useMutation({
    mutationFn: ({ itemId, value }: { itemId: string; value: Answer }) =>
      postLmsEngagementReviewAnswer(itemId, { answer: value }),
    onSuccess: (next) => {
      setResult(next)
      setStats((value) => ({ correct: value.correct + (next.correct ? 1 : 0), xp: value.xp + next.xp }))
    },
  })
  const grade = useMutation({
    mutationFn: ({ itemId, rating }: { itemId: string; rating: ReviewGradeRating }) =>
      postLmsEngagementReviewGrade(itemId, rating),
    onSuccess: (next, { rating }) => {
      setStats((value) => ({ correct: value.correct + (rating >= 3 ? 1 : 0), xp: value.xp + next.xp }))
      advance()
    },
  })

  const done = index >= items.length
  // XP, streak and the due count changed: refresh the header chip and the /my/ panel once the session ends. The review
  // list is only marked stale: refetching it now would swap the summary below for the empty state.
  useEffect(() => {
    if (!done) return
    void queryClient.invalidateQueries({
      queryKey: keys.lms.engagement(),
      predicate: (query) => query.queryKey[2] !== "review",
    })
    void queryClient.invalidateQueries({ queryKey: keys.lms.engagementReview(), refetchType: "none" })
  }, [done, queryClient])
  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-2xl font-bold">{t("review.doneTitle")}</p>
          <p className="text-muted-foreground">
            {t("review.doneBody", { correct: stats.correct, total: items.length, xp: stats.xp })}
          </p>
          <LinkButton href={hrefs.myCourses()} className="min-h-11 md:min-h-9">
            {t("review.back")}
          </LinkButton>
        </CardContent>
      </Card>
    )
  }
  const item = items[index]!
  const failed = answer.isError ? answer.error : grade.isError ? grade.error : null
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-[calc(var(--bottom-nav-height)+1rem)] md:pb-0">
      <div className="flex flex-col gap-1">
        <div className="text-muted-foreground flex justify-between text-sm">
          <span>{t("review.counter", { index: index + 1, total: items.length })}</span>
          <span className="tabular-nums">{t("xpGain", { xp: stats.xp })}</span>
        </div>
        <Progress value={percent(index, items.length)} aria-label={t("review.progress")} />
      </div>
      <ReviewCard
        key={item.item_id}
        item={item}
        result={result}
        pending={answer.isPending || grade.isPending}
        error={failed ? errorMessage(failed) : undefined}
        onAnswer={(value) => answer.mutate({ itemId: item.item_id, value })}
        onGrade={(rating) => grade.mutate({ itemId: item.item_id, rating })}
        onNext={() => {
          answer.reset()
          advance()
        }}
      />
    </div>
  )
}

/** `/review/`: today's spaced-repetition session (questions and flashcards, up to 20). */
export function ReviewSessionPage() {
  const t = useT("engagement")
  const review = useQuery({ ...getLmsEngagementReviewQuery(), staleTime: Infinity, refetchOnWindowFocus: false })
  return (
    <StepikScope>
      <PageContainer title={t("review.title")}>
        <QueryState
          query={review}
          isEmpty={(data) => data.items.length === 0}
          emptyText={t("review.empty")}
          emptyAction={
            <LinkButton href={hrefs.myCourses()} className="min-h-11 md:min-h-8">
              {t("review.back")}
            </LinkButton>
          }
        >
          {(data) => <Session list={data} />}
        </QueryState>
      </PageContainer>
    </StepikScope>
  )
}
