"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { useInterview, usePostInterview, type Rewrite } from "../api"

/**
 * The AI interview: up to three rounds of short questions with quick replies. The model never writes the
 * description; a proposal is applied to the form field by field, and the student still saves.
 */
export function InterviewPanel({
  itemId,
  onApply,
}: {
  itemId: string
  onApply: (field: keyof Rewrite, value: string) => void
}) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const [open, setOpen] = useState(false)
  const interview = useInterview(itemId, open)
  const post = usePostInterview(itemId)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const rounds = interview.data?.rounds ?? []
  const last = rounds.at(-1)
  const questions = last?.questions.questions ?? []
  const pending = !!last && !interview.data?.ready && questions.length > 0

  const send = () => {
    post.mutate({ answers }, { onSuccess: () => setAnswers({}) })
  }
  const proposal = interview.data?.proposal

  return (
    <section aria-label={t("interview.title")} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("interview.title")}</h2>
        {!open ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Icons.sparkles aria-hidden />
            {t("interview.start")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={post.isPending}
            onClick={() => post.mutate({ answers: {}, restart: true })}
          >
            {t("interview.restart")}
          </Button>
        )}
      </div>
      {open ? (
        <div role="log" aria-live="polite" className="flex flex-col gap-3">
          {interview.isPending ? <p className="text-muted-foreground text-sm">{t("interview.loading")}</p> : null}
          {interview.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(interview.error)}
            </p>
          ) : null}
          {interview.data?.safeguarding ? <p className="text-sm">{t("review.safeguarding")}</p> : null}
          {rounds.map((round) => (
            <div key={round.round} className="flex flex-col gap-2">
              {(round.questions.questions ?? []).map((q, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <p className="bg-muted w-fit max-w-full rounded-card px-3 py-2 text-sm">{q.question}</p>
                  {round.answers[String(i)] ? (
                    <p className="bg-primary/10 ms-auto w-fit max-w-full rounded-card px-3 py-2 text-sm">
                      {round.answers[String(i)]}
                    </p>
                  ) : null}
                  {round === last && pending ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {(q.options ?? []).map((option) => (
                          <Button
                            key={option}
                            type="button"
                            size="sm"
                            variant={answers[String(i)] === option ? "default" : "outline"}
                            onClick={() => setAnswers((a) => ({ ...a, [String(i)]: option }))}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                      <Textarea
                        aria-label={q.question}
                        rows={2}
                        maxLength={500}
                        value={answers[String(i)] ?? ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [String(i)]: e.target.value }))}
                      />
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
          {pending ? (
            <Button
              type="button"
              size="sm"
              className="w-fit"
              disabled={post.isPending || Object.values(answers).every((v) => !v.trim())}
              onClick={send}
            >
              <Icons.send aria-hidden />
              {t("interview.send")}
            </Button>
          ) : null}
          {post.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(post.error)}
            </p>
          ) : null}
          {proposal ? (
            <div className="border-hairline flex flex-col gap-2 rounded-card border p-3">
              <h3 className="text-sm font-semibold">{t("interview.proposal")}</h3>
              {(["position", "org", "description"] as const).map((field) => (
                <div key={field} className="flex flex-col gap-1">
                  <p className="text-muted-foreground text-xs">{t(`interview.field.${field}`)}</p>
                  <p className="text-sm">{proposal[field]}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-fit"
                    onClick={() => onApply(field, proposal[field])}
                  >
                    {t("interview.apply")}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
