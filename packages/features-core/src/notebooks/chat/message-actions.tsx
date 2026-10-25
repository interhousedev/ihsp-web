"use client"

import type { NotebookMessage } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { IconCopy, IconPin, IconRefresh, IconThumbDown, IconThumbUp } from "@ihsp/ui"
import { toast } from "sonner"
import { useMessageFeedback, useSaveToNote } from "../api"
import { copyText, copyTextWithSources } from "../lib"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"

type MessageActionsProps = {
  notebookId: string
  message: NotebookMessage
  /** Regenerate is offered only on the last answer and only while no turn runs. */
  onRegenerate?: () => void
}

const ICON_BUTTON = "size-11 md:size-8"

/** The row under an answer: Save to note, Copy (markers become `[1][2]`, web markers `[w1]`), 👍, 👎 and Regenerate. */
export function MessageActions({ notebookId, message, onRegenerate }: MessageActionsProps) {
  const t = useT("notebooks.chat")
  const tm = useT("assistant.message")
  const tc = useT("common")
  const tw = useT("assistant.web")
  const errorMessage = useNotebookErrorMessage()
  const saveToNote = useSaveToNote(notebookId)
  const feedback = useMessageFeedback(notebookId)

  function save() {
    saveToNote.mutate(
      { messageId: message.id },
      {
        onSuccess: () => toast.success(t("savedToNote")),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  async function copy() {
    const copied = await copyText(copyTextWithSources(message.text, message.web, tw("copySources")))
    if (copied) toast.success(tc("copied"))
    else toast.error(errorMessage(undefined))
  }

  function rate(rating: "up" | "down") {
    if (message.feedback === rating) return
    feedback.mutate({ messageId: message.id, rating })
  }

  return (
    <div role="group" aria-label={t("answerActions")} className="-ms-2 flex flex-wrap items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 px-2 md:min-h-8"
        disabled={saveToNote.isPending}
        onClick={save}
      >
        <IconPin aria-hidden />
        {t("saveToNote")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={ICON_BUTTON}
        aria-label={tm("copy")}
        title={tm("copy")}
        onClick={() => void copy()}
      >
        <IconCopy aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={ICON_BUTTON}
        aria-label={tm("like")}
        title={tm("like")}
        aria-pressed={message.feedback === "up"}
        onClick={() => rate("up")}
      >
        <IconThumbUp aria-hidden className={cn(message.feedback === "up" && "fill-current")} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={ICON_BUTTON}
        aria-label={tm("dislike")}
        title={tm("dislike")}
        aria-pressed={message.feedback === "down"}
        onClick={() => rate("down")}
      >
        <IconThumbDown aria-hidden className={cn(message.feedback === "down" && "fill-current")} />
      </Button>
      {onRegenerate ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={ICON_BUTTON}
          aria-label={tm("regenerate")}
          title={tm("regenerate")}
          onClick={onRegenerate}
        >
          <IconRefresh aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}
