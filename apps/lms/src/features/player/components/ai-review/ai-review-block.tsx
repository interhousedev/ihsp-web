"use client"

import {
  ApiError,
  type AiReviewMessage,
  type AiReviewSession,
  type LearningAiReviewBlock,
  getLmsAiReviewSessionQuery,
  getLmsAiReviewSessionsQuery,
  postLmsAiReviewMessage,
  postLmsAiReviewSession,
  postLmsAiReviewSubmit,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Icons, Markdown, Skeleton, Textarea } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react"
import { useAiReviewUploads } from "../../hooks/use-ai-review-uploads"
import { refreshProgress } from "../../utils/fresh"
import { AI_REVIEW_MAX_FILES, acceptAttribute, latestReview } from "../../utils/ai-review"
import { FinalReview, ReviewMessage, ThinkingMessage } from "./review-message"
import { SessionHistory } from "./session-history"
import { UploadZone } from "./upload-zone"

/** Problem types with their own message (`player.aiReview.errors.*`). */
const KNOWN_ERRORS: Record<string, string> = {
  "lms/ai-review-closed": "closed",
  "lms/ai-review-no-submissions-left": "noSubmissionsLeft",
  "lms/ai-review-file-rejected": "fileRejected",
  "lms/ai-review-unavailable": "unavailable",
}

type Pending = { kind: "chat" | "submit"; text: string; names: string[] }

/**
 * The AI review of a student's work: public instructions, a chat in which the reviewer asks clarifying questions
 * (OpenUI blocks) and a submission that spends one of the block's attempts and ends with the final review. The
 * teacher's prompt and files never reach the browser.
 */
export function AiReviewBlock({
  block,
  courseId,
  stepId,
  preview,
  slug,
}: {
  block: LearningAiReviewBlock
  courseId: string
  stepId: string
  preview: boolean
  slug: string | null
}) {
  const t = useT("player")
  return (
    <section className="flex flex-col gap-4" data-ai-review={block.id}>
      <header className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icons.sparkles aria-hidden className="text-primary size-5" />
          {block.title || t("aiReview.title")}
        </h2>
        {block.instructions_public.trim() ? <Markdown>{block.instructions_public}</Markdown> : null}
        {block.criteria.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label={t("aiReview.criteria")}>
            {block.criteria.map((criterion) => (
              <li key={criterion.name} className="bg-muted rounded-full px-2.5 py-1 text-xs">
                {t("aiReview.criterion", { name: criterion.name, max: criterion.max_score })}
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      {preview ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">{t("aiReview.previewNote")}</p>
      ) : (
        <ReviewChat block={block} courseId={courseId} stepId={stepId} slug={slug} />
      )}
    </section>
  )
}

function ReviewChat({
  block,
  courseId,
  stepId,
  slug,
}: {
  block: LearningAiReviewBlock
  courseId: string
  stepId: string
  slug: string | null
}) {
  const t = useT("player")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const ids = { text: useId() }
  const sessionsQuery = getLmsAiReviewSessionsQuery(stepId, block.id)
  const sessions = useQuery(sessionsQuery)
  const [picked, setPicked] = useState<string | null>(null)
  const currentId = picked ?? sessions.data?.items[0]?.id ?? null
  const session = useQuery({ ...getLmsAiReviewSessionQuery(currentId ?? ""), enabled: currentId !== null })
  const uploads = useAiReviewUploads(block.accepted_types, AI_REVIEW_MAX_FILES)
  const [text, setText] = useState("")
  const [pending, setPending] = useState<Pending | null>(null)
  const thread = useRef<HTMLOListElement>(null)

  function store(next: AiReviewSession) {
    queryClient.setQueryData(getLmsAiReviewSessionQuery(next.id).queryKey, next)
  }

  function append(sessionId: string, messages: AiReviewMessage[]) {
    queryClient.setQueryData(getLmsAiReviewSessionQuery(sessionId).queryKey, (current: AiReviewSession | undefined) => {
      if (!current) return current
      const known = new Set(current.messages.map((message) => message.id))
      return { ...current, messages: [...current.messages, ...messages.filter((message) => !known.has(message.id))] }
    })
    void queryClient.invalidateQueries({ queryKey: getLmsAiReviewSessionQuery(sessionId).queryKey })
    void queryClient.invalidateQueries({ queryKey: sessionsQuery.queryKey })
  }

  const start = useMutation({
    mutationFn: () => postLmsAiReviewSession(stepId, block.id),
    onSuccess: (created) => {
      store(created)
      setPicked(created.id)
      uploads.clear()
      setText("")
      void queryClient.invalidateQueries({ queryKey: sessionsQuery.queryKey })
    },
  })

  const exchange = useMutation({
    mutationFn: async (input: Pending & { sessionId: string; fileIds: string[] }) =>
      input.kind === "submit"
        ? postLmsAiReviewSubmit(input.sessionId, { file_ids: input.fileIds, note: input.text })
        : postLmsAiReviewMessage(input.sessionId, { text: input.text, file_ids: input.fileIds }),
    onMutate: (input) => setPending({ kind: input.kind, text: input.text, names: input.names }),
    onSuccess: (result, input) => {
      append(input.sessionId, result.messages)
      uploads.clear()
      setText("")
      // The review can arrive on the submit or on the answer to a clarifying question.
      if (input.kind === "submit" || latestReview(result.messages) !== null)
        void refreshProgress(queryClient, { courseId, stepId, slug })
    },
    onSettled: () => setPending(null),
  })

  const current = session.data ?? null
  const messages = current?.messages ?? []
  const review = latestReview(messages)
  const closed = current?.status === "reviewed"
  const left = current?.submissions_left ?? block.max_submissions
  const busy = exchange.isPending || uploads.busy
  const canSend = current !== null && !closed && !busy && (text.trim() !== "" || uploads.fileIds.length > 0)
  // The server reviews the files of the latest student message when a submission brings none.
  const hasWork =
    uploads.fileIds.length > 0 ||
    messages.some((message) => message.role === "student" && message.attachments.length > 0)
  const canSubmit = current !== null && !closed && !busy && left > 0 && hasWork

  useEffect(() => {
    const list = thread.current
    if (list && typeof list.scrollTo === "function") list.scrollTo({ top: list.scrollHeight })
  }, [messages.length, pending])

  function send(kind: Pending["kind"]) {
    if (!current || (kind === "chat" ? !canSend : !canSubmit)) return
    const names = uploads.items.filter((item) => item.status === "done").map((item) => item.name)
    exchange.mutate({ kind, text: text.trim(), names, sessionId: current.id, fileIds: uploads.fileIds })
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send("chat")
    }
  }

  const failure = exchange.error ?? start.error
  const known = failure instanceof ApiError ? KNOWN_ERRORS[failure.type] : undefined
  const failureText = known ? t(`aiReview.errors.${known}`) : failure ? errorMessage(failure) : null

  if (sessions.isPending) return <Skeleton className="h-40 w-full" />
  if (sessions.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{errorMessage(sessions.error)}</AlertDescription>
      </Alert>
    )
  }

  const startButton = (
    <Button
      type="button"
      variant={currentId ? "outline" : "default"}
      onClick={() => start.mutate()}
      disabled={start.isPending}
      className="min-h-11 md:min-h-8"
    >
      <Icons.add aria-hidden />
      {t(currentId ? "aiReview.newConversation" : "aiReview.start")}
    </Button>
  )

  return (
    <div className="flex flex-col gap-4">
      {review ? <FinalReview message={review} /> : null}

      {currentId === null ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border p-4">
          <p className="text-sm">{t("aiReview.intro", { count: block.max_submissions })}</p>
          {startButton}
        </div>
      ) : session.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : session.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(session.error)}</AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border p-3 sm:p-4">
          <ol
            ref={thread}
            aria-label={t("aiReview.thread")}
            aria-live="polite"
            className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto"
          >
            {messages.length === 0 && !pending ? (
              <li className="text-muted-foreground text-sm">{t("aiReview.emptyThread")}</li>
            ) : null}
            {messages.map((message) => (
              <ReviewMessage key={message.id} message={message} />
            ))}
            {pending ? (
              <>
                {pending.text || pending.names.length > 0 ? (
                  <ReviewMessage
                    message={{
                      role: "student",
                      kind: "chat",
                      text: pending.text || null,
                      openui: null,
                      attachments: pending.names.map((name) => ({ file_id: name, name, content_type: "" })),
                    }}
                  />
                ) : null}
                <ThinkingMessage reviewing={pending.kind === "submit"} />
              </>
            ) : null}
          </ol>

          {closed ? (
            <div className="flex flex-col items-start gap-2 border-t pt-3">
              <p className="text-muted-foreground text-sm">{t("aiReview.closed")}</p>
              {left > 0 ? startButton : <p className="text-sm">{t("aiReview.noneLeft")}</p>}
            </div>
          ) : (
            <div className="flex flex-col gap-3 border-t pt-3">
              <UploadZone
                items={uploads.items}
                refused={uploads.refused}
                accept={acceptAttribute(block.accepted_types)}
                hint={t("aiReview.dropHint", {
                  types: block.accepted_types.map((kind) => t(`aiReview.kinds.${kind}`)).join(", "),
                  max: AI_REVIEW_MAX_FILES,
                })}
                disabled={exchange.isPending || uploads.items.length >= AI_REVIEW_MAX_FILES}
                compact={messages.length > 0}
                onFiles={(files) => uploads.add(files, uploads.items.length)}
                onRemove={uploads.remove}
              />
              <label htmlFor={ids.text} className="sr-only">
                {t("aiReview.composer")}
              </label>
              <Textarea
                id={ids.text}
                value={text}
                maxLength={4000}
                rows={3}
                placeholder={t("aiReview.composerPlaceholder")}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={onKeyDown}
                disabled={exchange.isPending}
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => send("chat")}
                  disabled={!canSend}
                  className="min-h-11 md:min-h-8"
                >
                  <Icons.send aria-hidden />
                  {t("aiReview.send")}
                </Button>
                <div className="flex flex-col items-stretch gap-1 sm:items-end">
                  <Button
                    type="button"
                    onClick={() => send("submit")}
                    disabled={!canSubmit}
                    className="min-h-11 md:min-h-8"
                  >
                    <Icons.badgeCheck aria-hidden />
                    {t("aiReview.submit", { count: left })}
                  </Button>
                  <span className="text-muted-foreground text-xs">
                    {left > 0
                      ? hasWork
                        ? t("aiReview.submitHint")
                        : t("aiReview.attachToSubmit")
                      : t("aiReview.noneLeft")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {failureText ? (
        <Alert variant="destructive">
          <AlertDescription>{failureText}</AlertDescription>
        </Alert>
      ) : null}

      {currentId !== null && !closed ? <div>{startButton}</div> : null}
      <SessionHistory items={sessions.data.items} currentId={currentId} onPick={setPicked} />
    </div>
  )
}
