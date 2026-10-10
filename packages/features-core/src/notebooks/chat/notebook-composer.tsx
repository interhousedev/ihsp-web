"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Textarea, cn, useOnline } from "@ihsp/ui"
import { IconArrowUp, IconPlayerStopFilled, IconSettings, IconWorld, IconX } from "@tabler/icons-react"
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
import { slashText, type SlashName } from "../../assistant-chat/slash-commands"
import { SlashChip, SlashMenu } from "../../assistant-chat/slash-menu"
import { useSlashInput } from "../../assistant-chat/use-slash-input"
import { useWebQuota } from "../../web-search"
import type { NotebookLimit } from "../api"
import { useWorkspace } from "../workspace-context"
import { ChatConfigDialog } from "./chat-config-dialog"
import { isTouchDevice, takeDraft } from "./composer-draft"
import type { RestoredDraft } from "./use-chat-turn"

const MAX_HEIGHT = 160

/** What the composer tells the chat about a question: whether the model may search the web too. */
export type ComposerSendOptions = { webSearch: boolean }

type NotebookComposerProps = {
  notebook: NotebookDetail
  limit: NotebookLimit
  /** A turn is running: the send arrow becomes **Stop**. */
  running: boolean
  /** The text of a question that failed before it was stored; it comes back into an empty field. */
  restore: RestoredDraft | null
  /** The "Search the web too" switch (it is kept per notebook by the chat, which also turns it off after a failure). */
  web: boolean
  onWebChange: (on: boolean) => void
  onSend: (text: string, options: ComposerSendOptions) => void
  onStop: () => void
}

/**
 * The pill under the conversation: autosizing textarea (Enter sends, Shift+Enter adds a line; on touch devices Enter
 * adds a line), the Configure chat gear, the web switch, the source counter and the send arrow. A reached limit, an
 * offline browser or a notebook without selected sources disables sending. The web switch (hidden when web search is
 * off for the deployment, disabled when today's searches are used) stays for read-only course staff: asking is not
 * a write.
 */
export function NotebookComposer({
  notebook,
  limit,
  running,
  restore,
  web,
  onWebChange,
  onSend,
  onStop,
}: NotebookComposerProps) {
  const t = useT("notebooks")
  const ts = useT("state")
  const tc = useT("assistant.composer")
  const tSlash = useT("assistant.slash")
  const webQuota = useWebQuota()
  const format = useFormatters()
  const workspace = useWorkspace()
  const online = useOnline()
  const inputId = useId()
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState("")
  const [command, setCommand] = useState<SlashName | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const restoredText = useRef<string | null>(null)

  const noSources = notebook.selected_source_count === 0
  const readOnly = notebook.can_write === false
  const locked = limit.reached || !online || readOnly
  const slash = useSlashInput({ text, setText, command, setCommand, fieldRef, disabled: locked })
  const canSend = !locked && !noSources && !running && (text.trim().length > 0 || command !== null)

  // The assistant sidebar writes a draft before it opens this chat; take it once.
  useEffect(() => {
    const draft = takeDraft(notebook.id)
    if (!draft) return
    setText((current) => current || draft)
    fieldRef.current?.focus()
  }, [notebook.id])

  // A failed question comes back into an empty field; when the chat sends it again by itself (Send without web
  // search) the restore is withdrawn and the unchanged text leaves the field.
  useEffect(() => {
    if (restore) {
      restoredText.current = restore.text
      setText((current) => (current === "" ? restore.text : current))
    } else if (restoredText.current !== null) {
      const restored = restoredText.current
      restoredText.current = null
      setText((current) => (current === restored ? "" : current))
    }
  }, [restore])

  // `field-sizing: content` is not available everywhere, so the height follows the content here.
  useLayoutEffect(() => {
    const field = fieldRef.current
    if (!field) return
    field.style.height = "auto"
    field.style.height = `${Math.min(field.scrollHeight, MAX_HEIGHT)}px`
  })

  // A remembered switch means nothing when web search is off, and nothing is left to search with when it is spent.
  const webOn = webQuota.enabled && web
  const webSearch = webOn && !webQuota.spent

  function submit() {
    if (!canSend) return
    const value = command ? slashText({ name: command, args: text.trim() }) : text.trim()
    setText("")
    setCommand(null)
    onSend(value, { webSearch })
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (slash.onKeyDown(event)) return
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
    if (isTouchDevice()) return
    event.preventDefault()
    submit()
  }

  const resetTime = limit.reached && limit.resetsAt ? format.time(limit.resetsAt) : "—"
  const limitText = limit.reached
    ? limit.scope === "session"
      ? t("limit.session", { time: resetTime })
      : t("limit.day", { time: resetTime })
    : null
  const webResetTime = webQuota.quota?.resets_at ? format.time(webQuota.quota.resets_at) : "—"
  const webLine = webQuota.spent
    ? tc("webNone", { time: webResetTime })
    : tc("webQuota", { remaining: webQuota.remaining, limit: webQuota.quota?.limit ?? 0 })

  return (
    <>
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        {limitText ? (
          <p role="status" className="bg-muted text-muted-foreground rounded-lg border px-3 py-2 text-sm">
            {limitText}
          </p>
        ) : null}
        {readOnly ? (
          <p role="status" className="bg-muted text-muted-foreground rounded-lg border px-3 py-2 text-sm">
            {t("course.readOnlyChat")}
          </p>
        ) : null}
        {!online ? (
          <p role="status" className="bg-muted text-muted-foreground rounded-lg border px-3 py-2 text-sm">
            {ts("offlineTitle")}
          </p>
        ) : null}
        <div className="bg-background focus-within:border-ring relative focus-within:ring-ring/30 flex flex-col gap-1 rounded-3xl border px-3 py-2 shadow-xs focus-within:ring-3">
          {slash.menu ? <SlashMenu {...slash.menu} /> : null}
          {webOn || command ? (
            <div className="flex flex-wrap items-center gap-1 pt-1">
              {command ? <SlashChip name={command} onRemove={() => setCommand(null)} /> : null}
              {webOn ? (
                <Badge variant="secondary" className="gap-1 pe-0.5">
                  <IconWorld aria-hidden />
                  {tc("webBadge")}
                  <button
                    type="button"
                    className="hover:bg-background focus-visible:ring-ring inline-flex size-6 items-center justify-center rounded-full outline-hidden focus-visible:ring-2"
                    aria-label={t("chat.webOff")}
                    onClick={() => onWebChange(false)}
                  >
                    <IconX className="size-3.5" aria-hidden />
                  </button>
                </Badge>
              ) : null}
            </div>
          ) : null}
          <label htmlFor={inputId} className="sr-only">
            {t("chat.inputLabel")}
          </label>
          <Textarea
            id={inputId}
            ref={fieldRef}
            data-notebook-composer=""
            value={text}
            rows={1}
            disabled={locked}
            placeholder={command ? tSlash(`${command}.args`) : t("chat.placeholder")}
            className="field-sizing-fixed max-h-40 min-h-11 resize-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
            onChange={(event) => slash.onTextChange(event.target.value)}
            onKeyDown={onKeyDown}
            {...slash.fieldProps}
          />
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 rounded-full"
              aria-label={t("menu.configureChat")}
              title={t("menu.configureChat")}
              onClick={() => setConfigOpen(true)}
            >
              <IconSettings aria-hidden />
            </Button>
            <div className="flex min-w-0 items-center gap-1">
              {webQuota.enabled ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="aria-pressed:bg-primary/10 aria-pressed:text-primary size-11 shrink-0 rounded-full"
                  aria-label={t("chat.web")}
                  aria-pressed={webOn}
                  title={webQuota.spent ? webLine : t("chat.web")}
                  disabled={webQuota.spent}
                  onClick={() => onWebChange(!web)}
                >
                  <IconWorld aria-hidden />
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                className={cn("min-h-11 rounded-full px-3", noSources && "text-destructive hover:text-destructive")}
                onClick={() => workspace.showTab("sources")}
              >
                {noSources ? t("chat.noSources") : t("chat.sourcesCount", { count: notebook.selected_source_count })}
              </Button>
              {running ? (
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
          </div>
        </div>
        {webOn ? (
          <p role="status" className="text-muted-foreground flex items-center gap-1 px-3 text-xs">
            <IconWorld className="size-3.5 shrink-0" aria-hidden />
            {webLine}
          </p>
        ) : null}
        <p className="text-muted-foreground hidden truncate text-center text-[11px] sm:block">{t("chat.disclaimer")}</p>
      </form>
      {/* Outside of the form: events of a portal bubble through React, and the dialog has a form of its own. */}
      <ChatConfigDialog notebook={notebook} open={configOpen} onOpenChange={setConfigOpen} />
    </>
  )
}
