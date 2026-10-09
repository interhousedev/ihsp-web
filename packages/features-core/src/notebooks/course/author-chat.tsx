"use client"

import { keys } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, NativeSelect, NativeSelectOption, StateView } from "@ihsp/ui"
import { IconArrowDown, IconMessagePlus } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useRef, useState } from "react"
import { ChatMessageList, type PendingMessage } from "../../assistant-chat/chat-message-list"
import { limitState } from "../../assistant-chat/limit-info"
import type { Rating } from "../../assistant-chat/message-actions"
import {
  useChat,
  useChats,
  useCreateChat,
  useDecideToolCall,
  useFeedback,
  useRegenerate,
  useSendMessage,
  useUsage,
} from "../../assistant-chat/use-assistant-queries"
import { useStickToBottom } from "../../assistant-chat/use-stick-to-bottom"
import { UsageBar } from "../../assistant-chat/usage-bar"
import { invalidateCourseDraft } from "../api/use-course-workspace"
import { AuthorComposer } from "./author-composer"

const ASSISTANT = "lms_author"
const NO_ACTIONS = { shareChat: () => undefined }
const STARTERS = ["plan", "lesson", "test", "review"] as const

function isAbort(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (error instanceof Error && error.name === "AbortError")
}

/** After a write tool ran, what the author sees elsewhere (outline, steps, sources, Studio outputs) is stale. */
function useRefreshAfterWrite(courseId: string, notebookId: string) {
  const queryClient = useQueryClient()
  return () => {
    void invalidateCourseDraft(queryClient, courseId)
    void queryClient.invalidateQueries({ queryKey: keys.notebooks.artifacts(notebookId) })
    void queryClient.invalidateQueries({ queryKey: keys.notebooks.sources(notebookId) })
    void queryClient.invalidateQueries({ queryKey: keys.notebooks.courseSteps(notebookId) })
  }
}

function AuthorChatPane({ chatId, courseId, notebookId }: { chatId: string; courseId: string; notebookId: string }) {
  const t = useT("notebooks")
  const ta = useT("assistant")
  const queryClient = useQueryClient()
  const errorMessage = useErrorMessage()
  const refreshAfterWrite = useRefreshAfterWrite(courseId, notebookId)
  const chat = useChat(chatId)
  const usage = useUsage(ASSISTANT, courseId)
  const send = useSendMessage(chatId, ASSISTANT)
  const decide = useDecideToolCall(chatId, ASSISTANT)
  const regenerate = useRegenerate(chatId, ASSISTANT)
  const feedback = useFeedback(chatId)
  const [pending, setPending] = useState<PendingMessage | null>(null)
  const [actionError, setActionError] = useState<unknown>(null)
  const [ratings, setRatings] = useState<Record<number, Rating>>({})
  const [prefill, setPrefill] = useState<{ key: number; text: string } | null>(null)
  const abort = useRef<AbortController | null>(null)

  const detail = chat.data
  const messages = detail?.messages
  const lastMessage = messages?.[messages.length - 1]
  const limit = limitState(usage.data)
  const busy = send.isPending || decide.isPending || regenerate.isPending
  const regeneratingSeq = regenerate.isPending && lastMessage?.role === "assistant" ? lastMessage.seq : null
  const followKey = `${chat.isSuccess}:${messages?.length ?? 0}:${pending?.text ?? ""}:${busy}`
  const { containerRef, atBottom, onScroll, scrollToBottom } = useStickToBottom(followKey)

  async function handleSend(text: string): Promise<boolean> {
    const controller = new AbortController()
    abort.current = controller
    setActionError(null)
    setPending({ text, fileIds: [] })
    try {
      await send.mutateAsync({ text, fileIds: [], signal: controller.signal })
      return true
    } catch (error) {
      if (isAbort(error, controller.signal)) void queryClient.invalidateQueries({ queryKey: keys.ai.chat(chatId) })
      else setActionError(error)
      return false
    } finally {
      setPending(null)
      abort.current = null
    }
  }

  if (chat.isPending) return <StateView state="loading" rows={4} className="m-4" />
  if (chat.isError || !detail) {
    return <StateView state="error" error={chat.error} onRetry={() => void chat.refetch()} className="m-4" />
  }
  const shownError = actionError ?? decide.error
  const empty = detail.messages.length === 0 && pending === null

  return (
    <section aria-label={detail.title} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} onScroll={onScroll} className="h-full overflow-y-auto">
          <ChatMessageList
            chat={detail}
            ratings={ratings}
            pending={pending}
            busy={busy}
            regeneratingSeq={regeneratingSeq}
            limitReachedTurn={send.data?.status === "limit_reached"}
            actions={NO_ACTIONS}
            onApprove={(callId) => {
              setActionError(null)
              decide.mutate({ callId, decision: "approve" }, { onSuccess: refreshAfterWrite })
            }}
            onReject={(callId, reason) => {
              setActionError(null)
              decide.mutate({ callId, decision: "reject", reason })
            }}
            onRate={(seq, rating) => {
              setRatings((current) => ({ ...current, [seq]: rating }))
              feedback.mutate({ seq, rating })
            }}
            onRegenerate={() => {
              setActionError(null)
              regenerate.mutate(undefined, { onError: (error) => setActionError(error) })
            }}
          />
          {empty ? (
            <ul aria-label={t("course.author.starters")} className="mx-auto flex max-w-3xl flex-wrap gap-2 px-4 pb-6">
              {STARTERS.map((starter, index) => (
                <li key={starter}>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 rounded-full px-4 md:min-h-9"
                    onClick={() =>
                      setPrefill({ key: (prefill?.key ?? 0) + 1 + index, text: t(`course.author.starter.${starter}`) })
                    }
                  >
                    {t(`course.author.starterLabel.${starter}`)}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {atBottom ? null : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="bg-background absolute start-1/2 bottom-3 size-11 -translate-x-1/2 rounded-full shadow-md rtl:translate-x-1/2"
            aria-label={ta("message.scrollDown")}
            onClick={() => scrollToBottom(true)}
          >
            <IconArrowDown aria-hidden />
          </Button>
        )}
      </div>
      <div className="shrink-0 px-3 pt-1 pb-3 md:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
          {shownError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(shownError)}
            </p>
          ) : null}
          <AuthorComposer
            sending={send.isPending}
            limit={limit}
            onSend={handleSend}
            onStop={() => abort.current?.abort()}
            prefill={prefill}
          />
          <UsageBar usage={usage.data} />
        </div>
      </div>
    </section>
  )
}

/**
 * The author assistant of a course workspace: the newest chat of this course (a picker switches, "New chat" starts
 * another), the conversation with the approval cards of its write tools, and the composer. Anything an approved
 * tool wrote refreshes the editor's draft queries.
 */
export function AuthorChat({ courseId, notebookId }: { courseId: string; notebookId: string }) {
  const t = useT("notebooks")
  const errorMessage = useErrorMessage()
  const selectId = useId()
  const chats = useChats(ASSISTANT, courseId)
  const create = useCreateChat(ASSISTANT, courseId)
  const items = chats.data?.items ?? []
  const [chosen, setChosen] = useState<string | null>(null)
  const chatId = chosen && items.some((item) => item.id === chosen) ? chosen : (items[0]?.id ?? null)

  // A workspace without a chat yet gets one when the author opens this mode.
  const started = useRef(false)
  const { mutate: createChat } = create
  useEffect(() => {
    if (!chats.isSuccess || items.length > 0 || started.current) return
    started.current = true
    createChat(undefined, { onSuccess: (chat) => setChosen(chat.id) })
  }, [chats.isSuccess, items.length, createChat])

  if (chats.isPending) return <StateView state="loading" rows={3} className="m-4" />
  if (chats.isError)
    return <StateView state="error" error={chats.error} onRetry={() => void chats.refetch()} className="m-4" />

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5 md:px-6">
        <label htmlFor={selectId} className="sr-only">
          {t("course.author.chatPicker")}
        </label>
        <NativeSelect
          id={selectId}
          className="min-h-11 min-w-0 flex-1 md:min-h-8"
          value={chatId ?? ""}
          disabled={items.length === 0}
          onChange={(event) => setChosen(event.target.value)}
        >
          {items.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.title}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 shrink-0 gap-1.5 md:min-h-8"
          disabled={create.isPending}
          onClick={() => create.mutate(undefined, { onSuccess: (chat) => setChosen(chat.id) })}
        >
          <IconMessagePlus aria-hidden className="size-4" />
          {t("course.author.newChat")}
        </Button>
      </div>
      {create.isError ? (
        <p role="alert" className="text-destructive px-3 py-2 text-sm">
          {errorMessage(create.error)}
        </p>
      ) : null}
      {chatId ? (
        <AuthorChatPane key={chatId} chatId={chatId} courseId={courseId} notebookId={notebookId} />
      ) : (
        <StateView state="loading" rows={3} className="m-4" />
      )}
    </div>
  )
}
