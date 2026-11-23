"use client"

import { getLmsTutorQuery, isApiError, keys, postLmsTutor, type TutorConversation, type TutorLanguage } from "@ihsp/api"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Icons,
  Markdown,
  LoadingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Spinner,
  Textarea,
  cn,
  useIsMobile,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type FormEvent, useEffect, useId, useRef, useState } from "react"

const MESSAGE_MAX = 2000

/**
 * The Socratic step tutor: an "Ask the tutor" button under the step that opens a side panel (a bottom sheet on a
 * phone). The tutor answers with hints and questions, never with the answer. Nothing shows when the course turned the
 * tutor off (`403 lms/tutor-disabled`) or the caller may not use it.
 */
export function TutorPanel({ stepId }: { stepId: string }) {
  const t = useT("player")
  const errorMessage = useErrorMessage()
  const locale = useLocale() as TutorLanguage
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const inputId = useId()
  const end = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const conversation = useQuery({ ...getLmsTutorQuery(stepId), retry: false })

  const ask = useMutation<TutorConversation, unknown, string>({
    mutationFn: (message) => postLmsTutor(stepId, { message, language: locale }),
    onSuccess: (next) => {
      queryClient.setQueryData(keys.lms.tutor(stepId), next)
      setDraft("")
    },
  })

  const messages = conversation.data?.messages ?? []
  const remaining = conversation.data?.remaining_today ?? null
  const pending = ask.isPending
  useEffect(() => {
    // Keep the newest message (or the thinking line) in view.
    if (open && (messages.length > 0 || pending)) end.current?.scrollIntoView({ block: "end" })
  }, [open, messages.length, pending])

  // Off for the course (403 lms/tutor-disabled) or the caller is not a learner of it: no button at all.
  const hidden =
    isApiError(conversation.error) && (conversation.error.status === 403 || conversation.error.status === 404)
  if (conversation.isPending || hidden) return null

  const limitReached = remaining === 0 || (isApiError(ask.error) && ask.error.type === "lms/tutor-daily-limit")
  const text = draft.trim()
  const canSend = text !== "" && text.length <= MESSAGE_MAX && !ask.isPending && !limitReached

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (canSend) ask.mutate(text)
  }

  return (
    <div className="px-4 pb-2 md:px-6">
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="min-h-11 md:min-h-9">
        <Icons.sparkles aria-hidden />
        {t("tutor.open")}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          data-tutor-panel=""
          side={isMobile ? "bottom" : "right"}
          className={cn("flex flex-col gap-0 p-0", isMobile ? "max-h-[85dvh]" : "w-full sm:max-w-md")}
        >
          <SheetHeader className="gap-1 border-b p-4 pe-12">
            <SheetTitle>{t("tutor.title")}</SheetTitle>
            <SheetDescription>{t("tutor.socratic")}</SheetDescription>
            {remaining !== null ? (
              <p className="text-muted-foreground text-xs" aria-live="polite">
                {t("tutor.remaining", { count: remaining })}
              </p>
            ) : null}
          </SheetHeader>

          <div className="min-h-40 flex-1 overflow-y-auto p-4" aria-live="polite">
            {conversation.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage(conversation.error)}</AlertDescription>
              </Alert>
            ) : messages.length === 0 && !ask.isPending ? (
              <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
                <Icons.sparkles aria-hidden className="size-6" />
                <p>{t("tutor.empty")}</p>
              </div>
            ) : (
              <ol className="flex flex-col gap-3">
                {messages.map((message, index) => (
                  // eslint-disable-next-line react/no-array-index-key -- messages have no ids; the list only grows
                  <li key={index} className={cn("flex", message.role === "student" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        message.role === "student" && "whitespace-pre-wrap",
                        message.role === "student" ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      <span className="sr-only">
                        {message.role === "student" ? t("tutor.you") : t("tutor.tutor")}:{" "}
                      </span>
                      {message.role === "tutor" ? (
                        <Markdown className="text-sm">{message.text}</Markdown>
                      ) : (
                        message.text
                      )}
                    </div>
                  </li>
                ))}
                {ask.isPending ? (
                  <>
                    <li className="flex justify-end">
                      <div className="bg-primary/70 text-primary-foreground max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap">
                        {ask.variables}
                      </div>
                    </li>
                    <li className="text-muted-foreground flex items-center gap-2 text-sm" role="status">
                      <Spinner aria-hidden />
                      {t("tutor.thinking")}
                    </li>
                  </>
                ) : null}
              </ol>
            )}
            <div ref={end} />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-2 border-t p-4">
            {ask.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{limitReached ? t("tutor.limitReached") : errorMessage(ask.error)}</AlertDescription>
              </Alert>
            ) : limitReached ? (
              <p className="text-muted-foreground text-sm">{t("tutor.limitReached")}</p>
            ) : null}
            <label htmlFor={inputId} className="sr-only">
              {t("tutor.input")}
            </label>
            <Textarea
              id={inputId}
              value={draft}
              rows={2}
              maxLength={MESSAGE_MAX}
              disabled={limitReached}
              placeholder={t("tutor.placeholder")}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) submit(event)
              }}
            />
            <LoadingButton
              type="submit"
              loading={ask.isPending}
              disabled={!canSend}
              className="min-h-11 self-end md:min-h-9"
            >
              <Icons.send aria-hidden />
              {t("tutor.send")}
            </LoadingButton>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
