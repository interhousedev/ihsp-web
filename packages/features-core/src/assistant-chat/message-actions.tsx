"use client"

import type { ChatItem, ChatMessageView } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, cn } from "@ihsp/ui"
import {
  IconCheck,
  IconCopy,
  IconDots,
  IconRefresh,
  IconShare,
  IconThumbDown,
  IconThumbDownFilled,
  IconThumbUp,
  IconThumbUpFilled,
} from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { copyTextWithSources } from "../notebooks/lib/citations"
import { copyText } from "../notebooks/lib/download"
import { AddToNotebookSubMenu } from "./add-to-notebook-menu"
import type { ChatActions } from "./use-chat-actions"

export type Rating = "up" | "down"

type MessageActionsProps = {
  chat: ChatItem
  message: ChatMessageView
  /** The last message of the chat: its actions are always visible and it can be regenerated. */
  isLast: boolean
  rating: Rating | undefined
  /** A turn is running: regenerate is off. */
  busy: boolean
  actions: Pick<ChatActions, "shareChat">
  onRate: (seq: number, rating: Rating) => void
  onRegenerate: () => void
}

const BUTTON_CLASS = "text-muted-foreground size-11 md:size-8"
const COPIED_MS = 2000

/** Like, dislike, regenerate (last answer only), copy as Markdown (web markers as `[w1]` plus the URLs), and ⋯ More. */
export function MessageActions({
  chat,
  message,
  isLast,
  rating,
  busy,
  actions,
  onRate,
  onRegenerate,
}: MessageActionsProps) {
  const t = useT("assistant.message")
  const tw = useT("assistant.web")
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  async function copy() {
    if (!(await copyText(copyTextWithSources(message.text, message.web, tw("copySources"))))) return
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), COPIED_MS)
  }

  return (
    <div
      role="group"
      aria-label={t("actions")}
      className={cn(
        "-ms-2 flex items-center gap-0.5 transition-opacity focus-within:opacity-100 motion-reduce:transition-none",
        isLast ? "opacity-100" : "pointer-coarse:opacity-100 opacity-0 group-hover/message:opacity-100",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={BUTTON_CLASS}
        aria-label={t("like")}
        aria-pressed={rating === "up"}
        onClick={() => onRate(message.seq, "up")}
      >
        {rating === "up" ? <IconThumbUpFilled aria-hidden /> : <IconThumbUp aria-hidden />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={BUTTON_CLASS}
        aria-label={t("dislike")}
        aria-pressed={rating === "down"}
        onClick={() => onRate(message.seq, "down")}
      >
        {rating === "down" ? <IconThumbDownFilled aria-hidden /> : <IconThumbDown aria-hidden />}
      </Button>
      {isLast ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={BUTTON_CLASS}
          aria-label={t("regenerate")}
          disabled={busy}
          onClick={onRegenerate}
        >
          <IconRefresh aria-hidden />
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={BUTTON_CLASS}
        aria-label={copied ? t("copied") : t("copy")}
        title={copied ? t("copied") : t("copy")}
        onClick={() => void copy()}
      >
        {copied ? <IconCheck aria-hidden /> : <IconCopy aria-hidden />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button type="button" variant="ghost" size="icon" className={BUTTON_CLASS} aria-label={t("more")} />}
        >
          <IconDots aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <AddToNotebookSubMenu input={{ kind: "chat", chat_id: chat.id }} label={t("addChat")} />
          <DropdownMenuItem className="min-h-11 md:min-h-8" onClick={() => actions.shareChat(chat)}>
            <IconShare aria-hidden />
            {t("shareChat")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
