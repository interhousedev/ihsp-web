"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, GradeChip, GRADES, Icons, type Grade } from "@ihsp/ui"
import { useState } from "react"
import { DIMENSIONS, useReview, useReviewFeedback, type Review } from "../api"

const isGrade = (value: string | null | undefined): value is Grade =>
  !!value && (GRADES as readonly string[]).includes(value)

/** "Disagree?" and "Helpful" for one review; the unfair note is optional. */
function FeedbackControl({ reviewId }: { reviewId: string }) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const feedback = useReviewFeedback(reviewId)
  if (feedback.isSuccess)
    return (
      <p className="text-muted-foreground text-sm" role="status">
        {t("review.thanks")}
      </p>
    )
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={feedback.isPending}
        onClick={() => feedback.mutate({ kind: "helpful" })}
      >
        <Icons.check aria-hidden />
        {t("review.helpful")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={feedback.isPending}
        onClick={() => feedback.mutate({ kind: "unfair" })}
      >
        {t("review.disagree")}
      </Button>
      {feedback.isError ? (
        <span role="alert" className="text-destructive text-sm">
          {errorMessage(feedback.error)}
        </span>
      ) : null}
    </div>
  )
}

/** The E-A review: overall grade, four graded dimensions with evidence, and what to add. */
export function ReviewCard({ review, stale }: { review: Review; stale?: boolean }) {
  const t = useT("items")
  const grade = (dim: string, value: string | null | undefined) =>
    isGrade(value) ? (
      <GradeChip grade={value} label={t("review.gradeLabel", { dim: t(`review.dim.${dim}`), grade: value })} />
    ) : null

  if (review.safety_flag === "safeguarding") {
    return (
      <Alert>
        <AlertDescription>{t("review.safeguarding")}</AlertDescription>
      </Alert>
    )
  }
  const dims = review.payload.dimensions ?? []
  return (
    <article
      aria-labelledby={`review-${review.id}`}
      className="border-hairline flex flex-col gap-3 rounded-card border p-4"
    >
      <div className="flex items-center gap-3">
        {grade("overall", review.overall)}
        <h3 id={`review-${review.id}`} className="text-base font-semibold">
          {t("review.overall")}
        </h3>
      </div>
      {stale ? <p className="text-warning text-sm">{t("review.stale")}</p> : null}
      {review.safety_flag === "injection_suspected" ? (
        <Alert>
          <AlertDescription>{t("review.flagged")}</AlertDescription>
        </Alert>
      ) : null}
      <dl className="flex flex-col gap-3">
        {DIMENSIONS.map((dim) => {
          const row = dims.find((d) => d.dim === dim)
          return (
            <div key={dim} className="flex flex-col gap-0.5">
              <dt className="flex items-center gap-2 text-sm font-medium">
                {grade(dim, review.grades[dim] ?? row?.grade)}
                {t(`review.dim.${dim}`)}
              </dt>
              {row ? (
                <dd className="text-muted-foreground text-sm">
                  {row.evidence} {row.suggestion}
                </dd>
              ) : null}
            </div>
          )
        })}
      </dl>
      {review.payload.missing_facts?.length ? (
        <div>
          <h4 className="text-sm font-medium">{t("review.missing")}</h4>
          <ul className="text-muted-foreground list-disc ps-5 text-sm">
            {review.payload.missing_facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <FeedbackControl reviewId={review.id} />
    </article>
  )
}

/** Runs the review of one item and shows the newest result. */
export function ReviewSection({ itemId, review, stale }: { itemId: string; review: Review | null; stale: boolean }) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const run = useReview(itemId)
  const [shown, setShown] = useState<Review | null>(null)
  const current = shown ?? review
  return (
    <section aria-label={t("review.title")} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("review.title")}</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={run.isPending}
          onClick={() => run.mutate(undefined, { onSuccess: setShown })}
        >
          <Icons.sparkles aria-hidden />
          {run.isPending ? t("review.running") : current ? t("review.rerun") : t("review.run")}
        </Button>
      </div>
      {run.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(run.error)}
        </p>
      ) : null}
      {current ? (
        <ReviewCard review={current} stale={stale && !shown} />
      ) : (
        <p className="text-muted-foreground text-sm">{t("review.none")}</p>
      )}
    </section>
  )
}
