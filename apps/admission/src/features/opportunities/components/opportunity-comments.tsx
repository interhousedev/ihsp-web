"use client"

import { useSession } from "@ihsp/auth"
import { formatDateTime, useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, LoadingButton, Pill, Textarea } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useCommentMutations, type OppComment } from "../api"

function ReportForm({
  comment,
  onDone,
  send,
}: {
  comment: OppComment
  onDone: () => void
  send: (reason: string) => Promise<void>
}) {
  const t = useT("opportunities")
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await send(reason.trim())
      onDone()
    } finally {
      setBusy(false)
    }
  }
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={submit}
      aria-label={t("detail.reportTitle")}
      data-comment={comment.id}
    >
      <Textarea
        aria-label={t("detail.reportReason")}
        placeholder={t("detail.reportReason")}
        value={reason}
        maxLength={500}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex gap-2">
        <LoadingButton type="submit" size="sm" loading={busy} disabled={reason.trim() === ""}>
          {t("detail.reportSend")}
        </LoadingButton>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          {t("detail.cancel")}
        </Button>
      </div>
    </form>
  )
}

function CommentRow({
  comment,
  canModerate,
  opportunityId,
}: {
  comment: OppComment
  canModerate: boolean
  opportunityId: string
}) {
  const t = useT("opportunities")
  const errorMessage = useErrorMessage()
  const { session } = useSession()
  const { remove, report, hide } = useCommentMutations(opportunityId)
  const [reporting, setReporting] = useState(false)
  const mine = session?.user.id === comment.author_id
  const hidden = comment.status === "hidden"
  const onError = (error: unknown) => toast.error(errorMessage(error))

  async function sendReport(reason: string) {
    try {
      await report.mutateAsync({ id: comment.id, reason })
      toast.success(t("detail.reported"))
    } catch (error) {
      onError(error)
      throw error
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-card border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{comment.author_name}</span>
          <span className="text-muted-foreground text-xs">{formatDateTime(comment.created_at)}</span>
          {hidden ? <Pill tone="warning">{t("detail.hiddenPill")}</Pill> : null}
        </div>
        <div className="flex items-center gap-1">
          {mine ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("detail.delete")}
              disabled={remove.isPending}
              onClick={() => remove.mutate(comment.id, { onError })}
            >
              <Icons.trash aria-hidden className="size-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setReporting(true)}>
              <Icons.flag aria-hidden className="size-4" />
              {t("detail.report")}
            </Button>
          )}
          {canModerate ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={hide.isPending}
              onClick={() => hide.mutate({ id: comment.id, hidden: !hidden }, { onError })}
            >
              {hidden ? <Icons.eye aria-hidden className="size-4" /> : <Icons.eyeOff aria-hidden className="size-4" />}
              {hidden ? t("detail.unhide") : t("detail.hide")}
            </Button>
          ) : null}
        </div>
      </div>
      <p className={hidden ? "text-muted-foreground text-sm whitespace-pre-wrap" : "text-sm whitespace-pre-wrap"}>
        {comment.body}
      </p>
      {reporting ? <ReportForm comment={comment} send={sendReport} onDone={() => setReporting(false)} /> : null}
    </li>
  )
}

/** Comments under an opportunity: published at once; the author deletes, others report, staff hide. */
export function OpportunityComments({
  opportunityId,
  comments,
  canModerate,
}: {
  opportunityId: string
  comments: OppComment[]
  canModerate: boolean
}) {
  const t = useT("opportunities")
  const errorMessage = useErrorMessage()
  const { post } = useCommentMutations(opportunityId)
  const [body, setBody] = useState("")

  async function send(event: FormEvent) {
    event.preventDefault()
    try {
      await post.mutateAsync(body.trim())
      setBody("")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="opp-comments">
      <h2 id="opp-comments" className="flex items-center gap-2 text-lg font-semibold">
        {t("detail.comments")}
        <Pill>{comments.length}</Pill>
      </h2>
      <form className="flex flex-col gap-2" onSubmit={send}>
        <Textarea
          aria-label={t("detail.commentLabel")}
          placeholder={t("detail.commentLabel")}
          value={body}
          maxLength={2000}
          onChange={(e) => setBody(e.target.value)}
        />
        <LoadingButton
          type="submit"
          size="sm"
          className="self-start"
          loading={post.isPending}
          disabled={body.trim() === ""}
        >
          {t("detail.post")}
        </LoadingButton>
      </form>
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("detail.commentsEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comments.map((c) => (
            <CommentRow key={c.id} comment={c} canModerate={canModerate} opportunityId={opportunityId} />
          ))}
        </ul>
      )}
    </section>
  )
}
