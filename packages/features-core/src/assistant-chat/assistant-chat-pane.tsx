"use client"

import { keys, type FileItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, StateView } from "@ihsp/ui"
import { IconArrowDown, IconShare } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { useWebSearchErrorMessage, webSearchFailure } from "../web-search"
import { useAssistantScope } from "./assistant-context"
import { parseSlashText } from "./slash-commands"
import { ChatMessageList, type PendingMessage } from "./chat-message-list"
import { ChatPaneHeader } from "./chat-pane-header"
import { limitState } from "./limit-info"
import type { Rating } from "./message-actions"
import { takePendingTurn } from "./pending-turn"
import { PillComposer, type PillComposerHandle, type PillComposerProps, type PillSendOptions } from "./pill-composer"
import {
  useChat,
  useDecideToolCall,
  useFeedback,
  useRegenerate,
  useSendMessage,
  useUsage,
} from "./use-assistant-queries"
import { useChatActions } from "./use-chat-actions"
import { useStickToBottom } from "./use-stick-to-bottom"

type AssistantChatPaneProps = {
  chatId: string
  basePath: string
  /** Sidebar buttons of the workspace for the header (history sheet on phones, show the sidebar when hidden). */
  navButtons: ReactNode
  /** Compact usage meter for the top bar (phones, hidden sidebar). */
  trailing?: ReactNode
  /** Without the top bar (the author assistant has its own chat picker above). */
  bare?: boolean
  /** Shown in the empty conversation (starter chips). */
  empty?: ReactNode
  /** The composer placeholder; the assistant's by default. */
  placeholder?: string
  /** Fills the composer from outside (starter chips, command chips). */
  prefill?: PillComposerProps["prefill"]
  /** After an approved tool call finished (the author assistant refreshes the editor). */
  onToolApproved?: () => void
}

function isAbort(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (error instanceof Error && error.name === "AbortError")
}

/**
 * One chat of the student assistant: top bar, centred conversation (answers without bubbles, action row, thinking
 * indicator, scroll-to-latest), approval cards, the pill composer with a stop button, and the usage bar.
 * It also runs the first message that the home composer left in `sessionStorage` (`ihsp.assistant.pending.<id>`).
 */
export function AssistantChatPane({
  chatId,
  basePath,
  navButtons,
  trailing,
  bare = false,
  empty,
  placeholder,
  prefill,
  onToolApproved,
}: AssistantChatPaneProps) {
  const { assistant, courseId, features } = useAssistantScope()
  const t = useT("assistant")
  const router = useRouter()
  const queryClient = useQueryClient()
  const errorMessage = useErrorMessage()
  const webErrorMessage = useWebSearchErrorMessage()
  const chat = useChat(chatId)
  const usage = useUsage(assistant, courseId)
  const send = useSendMessage(chatId, assistant)
  const decide = useDecideToolCall(chatId, assistant)
  const regenerate = useRegenerate(chatId, assistant)
  const feedback = useFeedback(chatId)
  const [pending, setPending] = useState<PendingMessage | null>(null)
  const [actionError, setActionError] = useState<unknown>(null)
  // The message that a web search failure kept from going out, so it can be sent once more without the search.
  const [webFailed, setWebFailed] = useState<{ error: unknown; text: string; fileIds: string[] } | null>(null)
  const [ratings, setRatings] = useState<Record<number, Rating>>({})
  const abort = useRef<AbortController | null>(null)
  const composer = useRef<PillComposerHandle>(null)
  const started = useRef(false)
  const actions = useChatActions({
    onDeleted: (id) => {
      if (id === chatId) router.replace(`${basePath}/`)
    },
  })

  const detail = chat.data
  const messages = detail?.messages
  const lastMessage = messages?.[messages.length - 1]
  const limit = limitState(usage.data)
  const busy = send.isPending || decide.isPending || regenerate.isPending
  const regeneratingSeq = regenerate.isPending && lastMessage?.role === "assistant" ? lastMessage.seq : null
  const followKey = `${chat.isSuccess}:${messages?.length ?? 0}:${pending?.text ?? ""}:${busy}`
  const { containerRef, atBottom, onScroll, scrollToBottom } = useStickToBottom(followKey)

  async function runTurn(text: string, fileIds: string[], webSearch: boolean): Promise<boolean> {
    const controller = new AbortController()
    abort.current = controller
    setActionError(null)
    setWebFailed(null)
    setPending({ text, fileIds })
    // A slash command goes to the agent as {command, args}; it maps the command to its prompt or tool.
    const call = parseSlashText(text)
    try {
      await send.mutateAsync({
        text,
        fileIds,
        webSearch,
        ...(call ? { command: call } : {}),
        signal: controller.signal,
      })
      return true
    } catch (error) {
      if (isAbort(error, controller.signal)) {
        // The server may have stored the message already: show what it has.
        void queryClient.invalidateQueries({ queryKey: keys.ai.chat(chatId) })
      } else {
        setActionError(error)
        if (webSearch && webSearchFailure(error) !== null) {
          // The switch goes off (the quota is read again by the send), and the text can go out without the search.
          composer.current?.turnWebOff()
          setWebFailed({ error, text, fileIds })
        }
      }
      return false
    } finally {
      setPending(null)
      abort.current = null
    }
  }

  // The home composer creates the chat and leaves its first message here; it runs once, after the chat has loaded.
  const loaded = chat.isSuccess
  useEffect(() => {
    if (!loaded || started.current) return
    started.current = true
    const turn = takePendingTurn(chatId)
    if (turn) void runTurn(turn.text, turn.file_ids, turn.web === true)
    // `runTurn` only uses refs, mutation callbacks and state setters.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, chatId])

  function handleSend(text: string, files: FileItem[], options?: PillSendOptions): Promise<boolean> {
    return runTurn(
      text,
      files.map((file) => file.id),
      options?.webSearch === true,
    )
  }

  async function handleSendWithoutWeb() {
    if (!webFailed) return
    const { text, fileIds } = webFailed
    if (await runTurn(text, fileIds, false)) composer.current?.discardDraft(text)
  }

  function handleApprove(callId: string) {
    setActionError(null)
    decide.mutate({ callId, decision: "approve" }, { onSuccess: () => onToolApproved?.() })
  }

  function handleReject(callId: string, reason: string | undefined) {
    setActionError(null)
    decide.mutate({ callId, decision: "reject", reason })
  }

  function handleRegenerate() {
    setActionError(null)
    regenerate.mutate(undefined, { onError: (error) => setActionError(error) })
  }

  function handleRate(seq: number, rating: Rating) {
    const previous = ratings[seq]
    if (previous === rating) return
    setRatings((current) => ({ ...current, [seq]: rating }))
    feedback.mutate(
      { seq, rating },
      {
        onError: () => {
          setRatings((current) => {
            const { [seq]: _failed, ...rest } = current
            return previous ? { ...rest, [seq]: previous } : rest
          })
          toast.error(t("message.feedbackFailed"))
        },
      },
    )
  }

  if (chat.isPending) return <StateView state="loading" rows={4} className="m-4" />
  if (chat.isError || !detail) {
    return <StateView state="error" error={chat.error} onRetry={() => void chat.refetch()} className="m-4" />
  }

  const shownError = actionError ?? decide.error

  return (
    <section aria-label={detail.title} className="flex min-h-0 min-w-0 flex-1 flex-col">
      {bare ? null : (
        <ChatPaneHeader
          chat={detail}
          homeHref={`${basePath}/`}
          navButtons={navButtons}
          actions={actions}
          trailing={trailing}
        />
      )}
      {detail.shared && features.share ? (
        <Alert className="mx-auto mt-2 w-[calc(100%-2rem)] max-w-3xl">
          <IconShare aria-hidden />
          <AlertDescription>{t("chat.sharedBanner")}</AlertDescription>
        </Alert>
      ) : null}
      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} onScroll={onScroll} className="h-full overflow-y-auto">
          <ChatMessageList
            chat={detail}
            ratings={ratings}
            pending={pending}
            busy={busy}
            regeneratingSeq={regeneratingSeq}
            limitReachedTurn={send.data?.status === "limit_reached"}
            actions={actions}
            onApprove={handleApprove}
            onReject={handleReject}
            onRate={handleRate}
            onRegenerate={handleRegenerate}
          />
          {detail.messages.length === 0 && pending === null ? empty : null}
        </div>
        {atBottom ? null : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="bg-background absolute start-1/2 bottom-3 size-11 -translate-x-1/2 rounded-full shadow-md rtl:translate-x-1/2"
            aria-label={t("message.scrollDown")}
            onClick={() => scrollToBottom(true)}
          >
            <IconArrowDown aria-hidden />
          </Button>
        )}
      </div>
      <div className="shrink-0 px-4 pt-1 pb-3">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
          {shownError ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p role="alert" className="text-destructive text-sm">
                {webErrorMessage(shownError) ?? errorMessage(shownError)}
              </p>
              {webFailed && webFailed.error === shownError ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 md:min-h-8"
                  onClick={() => void handleSendWithoutWeb()}
                >
                  {t("message.sendWithoutWeb")}
                </Button>
              ) : null}
            </div>
          ) : null}
          <PillComposer
            ref={composer}
            chatId={chatId}
            sending={send.isPending}
            limit={limit}
            onSend={handleSend}
            onStop={() => abort.current?.abort()}
            placeholder={placeholder ?? t("composer.placeholder")}
            prefill={prefill}
          />
        </div>
      </div>
      {actions.dialogs}
    </section>
  )
}
