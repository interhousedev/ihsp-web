"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Textarea, useOnline } from "@ihsp/ui"
import { IconArrowUp, IconPlayerStopFilled } from "@tabler/icons-react"
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import type { LimitState } from "../../assistant-chat/limit-info"

export type AuthorComposerProps = {
  sending: boolean
  limit: LimitState
  /** Resolves `true` when the message was sent; on `false` the draft comes back. */
  onSend: (text: string) => Promise<boolean>
  onStop: () => void
  /** Fills the field from outside (a starter chip): a new `key` replaces the text and focuses the field. */
  prefill: { key: number; text: string } | null
}

function isTouchDevice(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
}

/** The input of the author assistant: a pill with an autosizing field, send and stop, and the limit notice. */
export function AuthorComposer({ sending, limit, onSend, onStop, prefill }: AuthorComposerProps) {
  const t = useT("notebooks")
  const format = useFormatters()
  const online = useOnline()
  const inputId = useId()
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState("")
  const locked = limit.reached || !online
  const canSend = !locked && !sending && text.trim().length > 0

  const prefillKey = prefill?.key
  const prefillText = prefill?.text
  useEffect(() => {
    if (prefillKey === undefined || prefillText === undefined) return
    setText(prefillText)
    const field = fieldRef.current
    if (!field) return
    field.focus()
    field.setSelectionRange(prefillText.length, prefillText.length)
  }, [prefillKey, prefillText])

  async function submit() {
    if (!canSend) return
    const draft = text.trim()
    setText("")
    const sent = await onSend(draft)
    if (!sent) setText((current) => (current === "" ? draft : current))
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
    if (isTouchDevice()) return
    event.preventDefault()
    void submit()
  }

  const resetTime = limit.reached && limit.resetsAt ? format.time(limit.resetsAt) : "—"
  const limitText = limit.reached
    ? limit.scope === "session"
      ? t("limit.session", { time: resetTime })
      : t("limit.day", { time: resetTime })
    : null

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      {limitText ? (
        <p role="status" className="bg-muted text-muted-foreground rounded-lg border px-3 py-2 text-sm">
          {limitText}
        </p>
      ) : null}
      <div className="bg-background focus-within:border-ring focus-within:ring-ring/30 flex items-end gap-2 rounded-3xl border px-3 py-2 shadow-xs focus-within:ring-3">
        <label htmlFor={inputId} className="sr-only">
          {t("course.author.inputLabel")}
        </label>
        <Textarea
          id={inputId}
          ref={fieldRef}
          value={text}
          rows={1}
          disabled={locked}
          placeholder={t("course.author.placeholder")}
          className="field-sizing-content max-h-40 min-h-11 flex-1 resize-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {sending ? (
          <Button
            type="button"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            aria-label={t("chat.stop")}
            title={t("chat.stop")}
            onClick={onStop}
          >
            <IconPlayerStopFilled aria-hidden />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className="disabled:bg-muted disabled:text-muted-foreground size-11 shrink-0 rounded-full disabled:opacity-100"
            aria-label={t("chat.send")}
            disabled={!canSend}
          >
            <IconArrowUp aria-hidden />
          </Button>
        )}
      </div>
      <p className="text-muted-foreground text-center text-xs">{t("chat.disclaimer")}</p>
    </form>
  )
}
