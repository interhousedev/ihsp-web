"use client"

import type { AssistantKind, ChatMessageView, FileItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, StateView } from "@ihsp/ui"
import { IconArrowLeft, IconShare } from "@tabler/icons-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ChatComposer } from "./chat-composer"
import { ChatMessage } from "./chat-message"
import { limitState } from "./limit-info"
import { ShareDialog } from "./share-dialog"
import { useChat, useDecideToolCall, useSendMessage, useUsage } from "./use-assistant-queries"
import { UsageBar } from "./usage-bar"

type ChatViewProps = {
  chatId: string
  assistant: AssistantKind
  basePath: string
}

const NO_MESSAGES: ChatMessageView[] = []

/** For every message, the tool calls that an earlier message already shows. */
function hiddenCallsPerMessage(messages: ChatMessageView[]): ReadonlySet<string>[] {
  const seen = new Set<string>()
  return messages.map((message) => {
    const hidden = new Set(seen)
    for (const call of message.tool_calls) seen.add(call.id)
    return hidden
  })
}

/** One chat: messages, approval cards, the input with its limit notice, and the usage bar. */
export function ChatView({ chatId, assistant, basePath }: ChatViewProps) {
  const t = useT("assistant.chat")
  const errorMessage = useErrorMessage()
  const chat = useChat(chatId)
  const usage = useUsage(assistant)
  const send = useSendMessage(chatId, assistant)
  const decide = useDecideToolCall(chatId, assistant)
  const [pendingText, setPendingText] = useState<string | null>(null)
  const [sendError, setSendError] = useState<unknown>(null)
  const [shareOpen, setShareOpen] = useState(false)

  const messages = chat.data?.messages ?? NO_MESSAGES
  const hidden = useMemo(() => hiddenCallsPerMessage(messages), [messages])
  const limit = limitState(usage.data)
  const busy = send.isPending || decide.isPending

  // A new key remounts the sentinel below, and mounting it scrolls the conversation to the end.
  const scrollKey = `${messages.length}:${pendingText !== null}:${busy}`

  async function handleSend(text: string, files: FileItem[]): Promise<boolean> {
    setSendError(null)
    setPendingText(text)
    try {
      await send.mutateAsync({ text, fileIds: files.map((file) => file.id) })
      return true
    } catch (error) {
      setSendError(error)
      return false
    } finally {
      setPendingText(null)
    }
  }

  function handleApprove(callId: string) {
    setSendError(null)
    decide.mutate({ callId, decision: "approve" })
  }

  function handleReject(callId: string, reason: string | undefined) {
    setSendError(null)
    decide.mutate({ callId, decision: "reject", reason })
  }

  if (chat.isPending) return <StateView state="loading" rows={4} />
  if (chat.isError) return <StateView state="error" error={chat.error} onRetry={() => void chat.refetch()} />

  const detail = chat.data
  const actionError = sendError ?? decide.error

  return (
    <section
      aria-label={detail.title}
      className="flex h-[calc(100dvh-13rem)] min-h-96 min-w-0 flex-col gap-2 md:h-[calc(100dvh-9rem)]"
    >
      <header className="flex items-center gap-2">
        <Link
          href={`${basePath}/`}
          aria-label={t("back")}
          className="hover:bg-muted inline-flex size-11 shrink-0 items-center justify-center rounded-lg md:hidden"
        >
          <IconArrowLeft aria-hidden />
        </Link>
        <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">{detail.title}</h2>
        {assistant === "student" ? (
          <Button type="button" variant="outline" className="min-h-11 shrink-0" onClick={() => setShareOpen(true)}>
            <IconShare aria-hidden />
            {t("share")}
          </Button>
        ) : null}
      </header>
      {detail.shared ? (
        <Alert>
          <IconShare aria-hidden />
          <AlertDescription>{t("sharedBanner")}</AlertDescription>
        </Alert>
      ) : null}

      <div
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-2"
        aria-live="polite"
        aria-label={t("messages")}
      >
        {messages.length === 0 && pendingText === null ? (
          <p className="text-muted-foreground m-auto max-w-sm text-center text-sm">{t("emptyChat")}</p>
        ) : null}
        {messages.map((message, index) => (
          <ChatMessage
            key={message.seq}
            message={message}
            hiddenCallIds={hidden[index] ?? new Set()}
            busy={busy}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
        {pendingText !== null ? (
          <div className="flex flex-col items-end gap-2" data-testid="pending-message">
            <div className="bg-primary text-primary-foreground max-w-[min(100%,36rem)] rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap break-words">
              {pendingText}
            </div>
          </div>
        ) : null}
        {send.isPending || decide.isPending ? (
          <p role="status" className="text-muted-foreground text-sm">
            {t("thinking")}
          </p>
        ) : null}
        {send.data?.status === "limit_reached" ? (
          <p role="status" className="text-muted-foreground text-sm">
            {t("limitReachedTurn")}
          </p>
        ) : null}
        <div key={scrollKey} ref={(node) => node?.scrollIntoView?.({ block: "end" })} />
      </div>

      {actionError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(actionError)}
        </p>
      ) : null}
      <ChatComposer sending={send.isPending} limit={limit} onSend={handleSend} />
      <UsageBar usage={usage.data} />
      {assistant === "student" ? (
        <ShareDialog open={shareOpen} onOpenChange={setShareOpen} kind="chat" targetId={detail.id} />
      ) : null}
    </section>
  )
}
