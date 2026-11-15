"use client"

import { keys } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  IconButton,
  Icons,
  Markdown,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  useOnline,
} from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useRef, useState, type FormEvent } from "react"
import { EMPTY_LIVE, applyLiveEvent, sendStreamed, type LiveAnswer } from "./stream-turn"
import { MessageWithOpenUi, chatLibrary } from "../openui"
import { useCreateChat, useUsage } from "./use-assistant-queries"

type Phase = "idle" | "streaming" | "done" | "error"

type QuickAssistantProps = {
  /** Where the full assistant lives; "Open in chat" goes to `<basePath>/chat/?id=…`. */
  basePath?: string
}

/**
 * Header button with a compact popover: one input, the answer streams below it and "Open in chat" continues in the
 * full assistant. The chat is created without a tier so the backend picks its default fast model. Hidden while
 * Administration has revoked the chat AI from the user; quota problems show through the translated error message.
 */
export function QuickAssistant({ basePath = "/assistant" }: QuickAssistantProps) {
  const t = useT("assistant.quick")
  const router = useRouter()
  const queryClient = useQueryClient()
  const errorMessage = useErrorMessage()
  const online = useOnline()
  const usage = useUsage("student")
  const createChat = useCreateChat("student")
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [live, setLive] = useState<LiveAnswer>(EMPTY_LIVE)
  const [answer, setAnswer] = useState("")
  const [error, setError] = useState<unknown>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const abort = useRef<AbortController | null>(null)

  if (usage.data?.ai_chat_blocked) return null

  function reset() {
    abort.current?.abort()
    abort.current = null
    setText("")
    setPhase("idle")
    setLive(EMPTY_LIVE)
    setAnswer("")
    setError(null)
    setChatId(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    // A running answer stops when the popover closes; a finished one is kept in the chat.
    if (!next) reset()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const question = text.trim()
    if (!question || phase === "streaming" || !online) return
    setPhase("streaming")
    setError(null)
    setLive(EMPTY_LIVE)
    const controller = new AbortController()
    abort.current = controller
    try {
      const chat = await createChat.mutateAsync(undefined)
      setChatId(chat.id)
      let current = EMPTY_LIVE
      const turn = await sendStreamed(
        chat.id,
        { text: question, file_ids: [] },
        {
          signal: controller.signal,
          onEvent: (streamEvent) => {
            current = applyLiveEvent(current, streamEvent)
            setLive(current)
          },
        },
      )
      queryClient.setQueryData(keys.ai.usage("student"), turn.usage)
      void queryClient.invalidateQueries({ queryKey: ["ai", "chats"] })
      setAnswer(turn.new_messages.findLast((message) => message.role === "assistant")?.text ?? "")
      setPhase("done")
    } catch (failure) {
      if (controller.signal.aborted) return
      void queryClient.invalidateQueries({ queryKey: keys.ai.usage("student") })
      setError(failure)
      setPhase("error")
    }
  }

  function openInChat() {
    if (!chatId) return
    setOpen(false)
    router.push(`${basePath}/chat/?id=${encodeURIComponent(chatId)}`)
  }

  const shown = phase === "done" ? answer : live.text

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal="trap-focus">
      <PopoverTrigger render={<IconButton icon={Icons.assistant} aria-label={t("open")} />} />
      <PopoverContent align="end" className="max-h-[75dvh] w-[min(24rem,calc(100vw-1rem))] gap-3 overflow-y-auto p-3">
        <form onSubmit={(event) => void handleSubmit(event)} className="flex items-center gap-2">
          <input
            aria-label={t("title")}
            placeholder={t("placeholder")}
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={phase === "streaming"}
            maxLength={4000}
            className="bg-background focus-visible:ring-ring/50 min-h-11 min-w-0 flex-1 rounded-full border px-4 text-base outline-none focus-visible:ring-3 md:min-h-10 md:text-sm"
          />
          <Button type="submit" size="sm" disabled={!text.trim() || phase === "streaming" || !online}>
            {t("send")}
          </Button>
        </form>
        {phase === "streaming" && !shown ? (
          <p role="status" className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner />
            {live.status || t("thinking")}
          </p>
        ) : null}
        {shown ? (
          <div aria-live="polite" className="min-w-0 text-sm">
            <MessageWithOpenUi
              text={shown}
              isStreaming={phase === "streaming"}
              library={chatLibrary}
              renderMarkdown={(part) => <Markdown>{part}</Markdown>}
            />
          </div>
        ) : null}
        {phase === "error" ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(error)}
          </p>
        ) : null}
        {phase === "done" && chatId ? (
          <Button type="button" variant="outline" className="min-h-11 self-start" onClick={openInChat}>
            {t("openChat")}
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
