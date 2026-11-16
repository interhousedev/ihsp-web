"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Markdown, Textarea } from "@ihsp/ui"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"
import {
  useDeleteThread,
  useLoadThread,
  useSendMessage,
  useSuggestions,
  useThreads,
  type AssistantAction,
  type OpenAction,
  type ProposeTaskAction,
  type Citation,
} from "./api"
import { useCreateTask } from "../tasks/api"
import { useReadScreen } from "./screen-context"

const isOpen = (action: AssistantAction): action is OpenAction => action.kind === "open" && !!action.url_path

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  citations: Citation[]
  actions: AssistantAction[]
}

function ProposeTask({ action }: { action: ProposeTaskAction }) {
  const t = useT("assistant")
  const errorMessage = useErrorMessage()
  const create = useCreateTask()
  const [done, setDone] = useState(false)
  const confirm = () =>
    create.mutate(
      {
        title: action.task.title,
        description: action.task.description,
        priority: "medium",
        start_date: null,
        deadline: action.task.due_on,
        steps: [],
        links: [],
      },
      {
        onSuccess: () => {
          setDone(true)
          toast.success(t("taskAdded"))
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  return (
    <div className="bg-muted/50 flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <p className="font-medium">{action.task.title}</p>
      {action.task.description ? <p className="text-muted-foreground">{action.task.description}</p> : null}
      {action.task.due_on ? (
        <p className="text-muted-foreground">{t("taskDue", { date: action.task.due_on })}</p>
      ) : null}
      {done ? (
        <p className="text-muted-foreground flex items-center gap-1">
          <Icons.check aria-hidden className="size-4" />
          {t("taskAdded")}
        </p>
      ) : (
        <Button size="sm" onClick={confirm} disabled={create.isPending}>
          {action.label || t("addTask")}
        </Button>
      )}
    </div>
  )
}

function MessageView({ message, onNavigate }: { message: ChatMessage; onNavigate: () => void }) {
  const t = useT("assistant")
  if (message.role === "user") {
    return (
      <div className="bg-primary text-primary-foreground ml-auto max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap">
        {message.content}
      </div>
    )
  }
  return (
    <div className="flex max-w-full flex-col gap-2">
      <Markdown className="leading-6">{message.content}</Markdown>
      {message.citations.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs">{t("sources")}</span>
          {message.citations.map((citation) => (
            <Link
              key={`${citation.source}:${citation.url_path}`}
              href={citation.url_path}
              onClick={onNavigate}
              className="bg-muted hover:bg-accent max-w-full truncate rounded-full border px-2 py-0.5 text-xs"
            >
              {citation.title}
            </Link>
          ))}
        </div>
      ) : null}
      {message.actions.map((action, index) =>
        isOpen(action) ? (
          <Link
            key={index}
            href={action.url_path}
            onClick={onNavigate}
            className="text-primary inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            {action.label}
            <Icons.arrowRight aria-hidden className="size-4" />
          </Link>
        ) : (
          <ProposeTask key={index} action={action as ProposeTaskAction} />
        ),
      )}
    </div>
  )
}

function History({ onPick }: { onPick: (id: string) => void }) {
  const t = useT("assistant")
  const threads = useThreads(true)
  const remove = useDeleteThread()
  if (!threads.data?.length) return <p className="text-muted-foreground p-4 text-sm">{t("noHistory")}</p>
  return (
    <ul className="flex flex-col gap-1 p-2">
      {threads.data.map((thread) => (
        <li key={thread.id} className="flex items-center gap-1">
          <button
            type="button"
            className="hover:bg-accent min-w-0 flex-1 truncate rounded-md px-3 py-2 text-left text-sm"
            onClick={() => onPick(thread.id)}
          >
            {thread.title || t("untitled")}
          </button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("deleteChat")}
            onClick={() => remove.mutate(thread.id)}
            disabled={remove.isPending}
          >
            <Icons.trash aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  )
}

/** The chat: starters, messages with sources and actions, a composer; `onClose` also runs when a link is followed. */
export function AssistantPanel({ onClose }: { onClose: () => void }) {
  const t = useT("assistant")
  const errorMessage = useErrorMessage()
  const path = usePathname()
  const readScreen = useReadScreen()
  const send = useSendMessage()
  const loadThread = useLoadThread()
  const suggestions = useSuggestions(path, true)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState("")
  const [view, setView] = useState<"chat" | "history">("chat")
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "end" })
  }, [messages.length, send.isPending])

  const submit = (message: string) => {
    const content = message.trim()
    if (!content || send.isPending) return
    setText("")
    setMessages((list) => [...list, { id: `u${list.length}`, role: "user", content, citations: [], actions: [] }])
    send.mutate(
      { thread_id: threadId, message: content, screen: readScreen() },
      {
        onSuccess: (reply) => {
          setThreadId(reply.thread_id)
          setMessages((list) => [
            ...list,
            {
              id: reply.message_id,
              role: "assistant",
              content: reply.reply,
              citations: reply.citations,
              actions: reply.actions,
            },
          ])
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit(text)
  }
  const reset = () => {
    setThreadId(null)
    setMessages([])
    setView("chat")
  }
  const open = (id: string) =>
    loadThread.mutate(id, {
      onSuccess: (thread) => {
        setThreadId(thread.id)
        setMessages(
          thread.messages.map(({ text, ...m }) => ({
            ...m,
            content: text,
            citations: m.citations ?? [],
            actions: m.actions ?? [],
          })),
        )
        setView("chat")
      },
      onError: (error) => toast.error(errorMessage(error)),
    })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b px-3 py-2">
        <Icons.sparkles aria-hidden className="text-primary size-4" />
        <h2 className="flex-1 text-sm font-semibold">{t("title")}</h2>
        <Button variant="ghost" size="icon" aria-label={t("newChat")} onClick={reset}>
          <Icons.add aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("history")}
          aria-pressed={view === "history"}
          onClick={() => setView(view === "history" ? "chat" : "history")}
        >
          <Icons.clock aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t("close")} onClick={onClose}>
          <Icons.close aria-hidden />
        </Button>
      </div>
      {view === "history" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <History onPick={open} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm">{t("welcome")}</p>
              {suggestions.data?.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submit(suggestion)}
                  className="hover:bg-accent rounded-lg border px-3 py-2 text-left text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : (
            messages.map((message) => <MessageView key={message.id} message={message} onNavigate={onClose} />)
          )}
          {send.isPending ? <p className="text-muted-foreground text-sm">{t("thinking")}</p> : null}
          <div ref={end} />
        </div>
      )}
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              submit(text)
            }
          }}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          rows={1}
          className="max-h-32 min-h-9 flex-1 resize-none"
        />
        <Button type="submit" size="icon" aria-label={t("send")} disabled={!text.trim() || send.isPending}>
          <Icons.send aria-hidden />
        </Button>
      </form>
    </div>
  )
}
