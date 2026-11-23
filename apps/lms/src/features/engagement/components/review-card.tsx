"use client"

import type { Answer, ReviewAnswerResult, ReviewGradeRating, ReviewItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Card, CardContent, Markdown, cn } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { QuestionField } from "../../player/components/question-field"
import { describeAnswer, isAnswered } from "../../player/utils/answers"
import { RATINGS } from "../utils/engagement"

export type ReviewCardProps = {
  item: ReviewItem
  /** The checked answer of a question item; `null` until the learner submits. */
  result: ReviewAnswerResult | null
  pending: boolean
  error?: string
  onAnswer: (answer: Answer) => void
  onGrade: (rating: ReviewGradeRating) => void
  /** Called after the feedback of a question item. */
  onNext: () => void
  className?: string
}

/**
 * One review item. A question is answered, checked by the server and shown with feedback; a flashcard is flipped and
 * graded Again / Hard / Good / Easy (FSRS). The card keeps the local input state; give it `key={item.item_id}`.
 */
export function ReviewCard({ item, result, pending, error, onAnswer, onGrade, onNext, className }: ReviewCardProps) {
  const t = useT("engagement")
  const [answer, setAnswer] = useState<Answer | undefined>(undefined)
  const [flipped, setFlipped] = useState(false)
  const nextRef = useRef<HTMLButtonElement>(null)
  // Bring the whole feedback and "Next" into view; its scroll margin keeps them above the mobile bottom nav.
  useEffect(() => {
    if (result) nextRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [result])

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-4">
        {item.kind === "question" && item.question ? (
          <>
            <QuestionField
              question={item.question}
              index={0}
              answer={answer}
              onChange={(next) => setAnswer(next ?? undefined)}
              disabled={pending || result !== null}
            />
            {result ? (
              <div
                role="status"
                className={cn(
                  "flex flex-col gap-1 rounded-lg border p-3 text-sm",
                  result.correct ? "border-success/50 bg-success/10" : "border-destructive/40 bg-destructive/10",
                )}
              >
                <p className="font-semibold">
                  {result.correct ? t("review.correct") : t("review.incorrect")}
                  {result.xp > 0 ? ` · ${t("xpGain", { xp: result.xp })}` : null}
                </p>
                {!result.correct && result.correct_answer ? (
                  <p>{t("review.correctAnswer", { answer: describeAnswer(item.question, result.correct_answer) })}</p>
                ) : null}
                {result.explanation ? <Markdown>{result.explanation}</Markdown> : null}
              </div>
            ) : null}
            {result ? (
              <Button
                ref={nextRef}
                autoFocus
                className="min-h-11 scroll-mb-[calc(var(--bottom-nav-height)+var(--safe-bottom)+1rem)] self-end md:min-h-9"
                onClick={onNext}
              >
                {t("review.next")}
              </Button>
            ) : (
              <Button
                className="min-h-11 self-end md:min-h-9"
                disabled={pending || !isAnswered(answer)}
                onClick={() => answer && onAnswer(answer)}
              >
                {t("review.check")}
              </Button>
            )}
          </>
        ) : null}

        {item.kind === "flashcard" && item.card ? (
          <>
            <div className="flex min-h-40 flex-col justify-center gap-3 rounded-lg border p-4 text-center">
              <Markdown>{item.card.front}</Markdown>
              {flipped ? (
                <>
                  <hr />
                  <Markdown>{item.card.back}</Markdown>
                </>
              ) : null}
            </div>
            {flipped ? (
              <div role="group" aria-label={t("review.rate")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RATINGS.map(({ rating, key }) => (
                  <Button
                    key={rating}
                    variant={rating === 1 ? "destructive" : rating === 3 ? "default" : "outline"}
                    className="min-h-11 md:min-h-9"
                    disabled={pending}
                    onClick={() => onGrade(rating)}
                  >
                    {t(`review.rating.${key}`)}
                  </Button>
                ))}
              </div>
            ) : (
              <Button autoFocus className="min-h-11 self-center md:min-h-9" onClick={() => setFlipped(true)}>
                {t("review.show")}
              </Button>
            )}
          </>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
