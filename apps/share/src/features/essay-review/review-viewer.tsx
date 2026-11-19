"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Input, Label, StateView, Textarea } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { addReviewComment, type ReviewComment, type ReviewView } from "./api"
import { useReview } from "./use-review"

function CommentForm({ token, onAdded }: { token: string; onAdded: (comment: ReviewComment) => void }) {
  const t = useT("share.essayReview")
  const errorMessage = useErrorMessage()
  const [name, setName] = useState("")
  const [body, setBody] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !body.trim()) return
    setPending(true)
    setError(null)
    try {
      onAdded(await addReviewComment(token, { author_name: name.trim(), body: body.trim() }))
      setBody("")
    } catch (e) {
      setError(e)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-name">{t("name")}</Label>
        <Input id="review-name" maxLength={80} value={name ?? ""} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-body">{t("comment")}</Label>
        <Textarea id="review-body" value={body ?? ""} onChange={(event) => setBody(event.target.value)} />
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(error)}
        </p>
      ) : null}
      <Button type="submit" className="self-start" disabled={pending || !name.trim() || !body.trim()}>
        {t("send")}
      </Button>
    </form>
  )
}

function Review({
  token,
  view,
  onAdded,
}: {
  token: string
  view: ReviewView
  onAdded: (comment: ReviewComment) => void
}) {
  const t = useT("share.essayReview")
  const fmt = useFormatters()
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <article className="bg-card rounded-card mx-auto flex w-full max-w-[44rem] flex-col gap-4 p-6 shadow-sm md:p-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight break-words">{view.essay.title}</h1>
          {view.essay.prompt_text ? (
            <p className="text-muted-foreground text-sm [overflow-wrap:anywhere]">{view.essay.prompt_text}</p>
          ) : null}
        </header>
        <div className="font-serif leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{view.essay.body}</div>
        <p className="text-muted-foreground text-sm">
          {t("words", { count: view.essay.word_count })} ·{" "}
          {t("validUntil", { time: fmt.dateTime(new Date(view.expires_at)) })}
        </p>
      </article>
      <aside aria-label={t("comments")} className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
        <h2 className="font-semibold">{t("comments")}</h2>
        {view.comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noComments")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {view.comments.map((comment) => (
              <li key={comment.id} className="border-hairline rounded-card border p-3 text-sm">
                <p className="font-medium">{comment.author_name}</p>
                {comment.quote ? (
                  <blockquote className="text-muted-foreground border-l-2 pl-2">{comment.quote}</blockquote>
                ) : null}
                <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}
        {view.can_comment ? (
          <CommentForm token={token} onAdded={onAdded} />
        ) : (
          <p className="text-muted-foreground text-sm">{t("readOnly")}</p>
        )}
      </aside>
    </div>
  )
}

/** The reviewer page: no account, no analytics; the token stays in memory. */
export function ReviewViewer() {
  const t = useT("share.essayReview")
  const { state, addComment } = useReview()
  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh outline-none">
      {state.kind === "loading" ? (
        <div className="mx-auto max-w-xl p-4">
          <StateView state="loading" rows={4} />
        </div>
      ) : state.kind === "ready" ? (
        <Review token={state.token} view={state.view} onAdded={addComment} />
      ) : state.kind === "error" ? (
        <div className="mx-auto max-w-xl p-4">
          <StateView state="error" error={state.error} />
        </div>
      ) : (
        <div className="mx-auto max-w-xl p-4">
          <StateView
            state="empty"
            title={state.kind === "limited" ? t("limitedTitle") : t("notFoundTitle")}
            description={state.kind === "limited" ? t("limitedText") : t("notFoundText")}
          />
        </div>
      )}
    </main>
  )
}
