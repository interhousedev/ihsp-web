"use client"

import type { FileItem, NotebookItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, OfflineBadge, cn, useOnline } from "@ihsp/ui"
import { IconArrowUp, IconPlayerStop, IconSchool, IconWorld, IconX } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useEffect, useId, useImperativeHandle, useRef, useState, type KeyboardEvent, type Ref } from "react"
import { useWebQuota } from "../web-search"
import { AttachFilesDialog } from "./attach-files-dialog"
import { ComposerPlusMenu } from "./composer-plus-menu"
import { ComposerUpload, type ComposerUploadHandle } from "./composer-upload"
import { FileChip } from "./file-chip"
import { useAssistantScope } from "./assistant-context"
import { withGuidedHint } from "./guided-hint"
import type { LimitState } from "./limit-info"
import { SlashChip, SlashMenu } from "./slash-menu"
import { slashText, type SlashCall, type SlashName } from "./slash-commands"
import { TierPicker } from "./tier-picker"
import type { ChatTier } from "./use-assistant-queries"
import { useSlashInput } from "./use-slash-input"
import { useWebSwitch } from "./use-web-switch"

/** What the student chose besides the text; the composer passes it only while a choice is on. */
export type PillSendOptions = {
  /** The web-search switch was on: send the message with `web_search: true`. */
  webSearch?: boolean
  /** The message is a slash command; `text` then is its short form (`/cards photosynthesis`). */
  command?: SlashCall
}

/** What the page can ask of the composer after a send (a web search failure). */
export type PillComposerHandle = {
  /** Turns the web switch off (and forgets it for this chat). */
  turnWebOff: () => void
  /**
   * The page sent `text` by another route (Send without web search): empties the field and the attachments when they
   * still hold the draft that came back from the failed send of that text.
   */
  discardDraft: (text: string) => void
}

export type PillComposerProps = {
  ref?: Ref<PillComposerHandle>
  sending: boolean
  limit: LimitState
  /**
   * Resolves `true` when the message was sent; on `false` the draft comes back. `options` is passed only while the
   * web switch is on.
   */
  onSend: (text: string, files: FileItem[], options?: PillSendOptions) => Promise<boolean>
  /** The chat this composer writes in: the web switch is remembered per chat. Omit on the home page (no chat yet). */
  chatId?: string
  /** While `sending`, the send button becomes a stop button that calls this (the page aborts the request). */
  onStop?: () => void
  placeholder: string
  /** The model class picker; only the home composer shows it (a chat keeps the tier it was created with). */
  tier?: { value: ChatTier; onChange: (tier: ChatTier) => void }
  /** Fills the field from outside (a suggestion chip): a new `key` sets the command chip (or the text) and focuses. */
  prefill?: { key: number; command?: SlashName; text?: string } | null
  autoFocus?: boolean
}

/** Where the notebook chat picks up the question typed here (`Ask a notebook`). */
export function notebookDraftKey(notebookId: string): string {
  return `ihsp.notebooks.draft.${notebookId}`
}

function isTouchDevice(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
}

/**
 * The Gemini-style input of the student assistant: `+` menu, autosizing field, tier picker (home), and a send button
 * that turns into stop while a turn runs. Same `onSend` contract and limit notice as `ChatComposer`.
 */
export function PillComposer({
  ref,
  sending,
  limit,
  onSend,
  chatId,
  onStop,
  placeholder,
  tier,
  prefill,
  autoFocus = false,
}: PillComposerProps) {
  const t = useT("assistant.composer")
  const tRoot = useT("assistant")
  const tSlash = useT("assistant.slash")
  const format = useFormatters()
  const router = useRouter()
  const { features } = useAssistantScope()
  const online = useOnline()
  const inputId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const uploadRef = useRef<ComposerUploadHandle>(null)
  const [text, setText] = useState("")
  const [command, setCommand] = useState<SlashName | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [guided, setGuided] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const slash = useSlashInput({ text, setText, command, setCommand, fieldRef: inputRef, disabled: false })
  const [web, setWeb] = useWebSwitch(chatId)
  const webQuota = useWebQuota()
  // The last draft that came back after a failed send, with the text that was sent for it.
  const returned = useRef<{ draft: string; sent: string } | null>(null)

  // A switch that was left on stays off-screen (and unsent) while the server has web search turned off.
  const webOn = web && webQuota.enabled && features.plus
  const locked = limit.reached || !online
  const canSend = !locked && !sending && (text.trim().length > 0 || command !== null)
  const stoppable = sending && onStop !== undefined

  useEffect(() => {
    if (autoFocus && !isTouchDevice()) inputRef.current?.focus()
  }, [autoFocus])

  const prefillKey = prefill?.key
  const prefillText = prefill?.text
  const prefillCommand = prefill?.command
  useEffect(() => {
    if (prefillKey === undefined) return
    if (prefillCommand) setCommand(prefillCommand)
    if (prefillText !== undefined) setText(prefillText)
    const field = inputRef.current
    if (!field) return
    field.focus()
    const end = (prefillText ?? "").length
    field.setSelectionRange(end, end)
  }, [prefillKey, prefillText, prefillCommand])

  useImperativeHandle(
    ref,
    () => ({
      turnWebOff: () => setWeb(false),
      discardDraft: (sentText) => {
        if (returned.current?.sent !== sentText) return
        const { draft } = returned.current
        returned.current = null
        setText((current) => (current === draft ? "" : current))
        setFiles([])
      },
    }),
    [setWeb],
  )

  async function submit() {
    if (!canSend) return
    const draft = { text: text.trim(), files, command }
    returned.current = null
    setText("")
    setCommand(null)
    setFiles([])
    const call: SlashCall | null = draft.command ? { name: draft.command, args: draft.text } : null
    const sentText = call ? slashText(call) : guided ? withGuidedHint(t("guidedHint"), draft.text) : draft.text
    const options: PillSendOptions = { ...(webOn ? { webSearch: true } : {}), ...(call ? { command: call } : {}) }
    const sent = await (Object.keys(options).length > 0
      ? onSend(sentText, draft.files, options)
      : onSend(sentText, draft.files))
    if (!sent) {
      returned.current = { draft: draft.text, sent: sentText }
      setText((current) => (current === "" ? draft.text : current))
      setCommand((current) => current ?? draft.command)
      setFiles((current) => (current.length === 0 ? draft.files : current))
    }
  }

  /** A command from the "+" menu: the chip goes in and the field takes the arguments. */
  function pickCommand(name: SlashName) {
    slash.pick(name)
  }

  function addFiles(added: FileItem[]) {
    setFiles((current) => [...current, ...added.filter((file) => !current.some((item) => item.id === file.id))])
  }

  function askNotebook(notebook: NotebookItem) {
    const draft = text.trim()
    try {
      if (draft) window.sessionStorage.setItem(notebookDraftKey(notebook.id), draft)
    } catch {
      // Blocked storage: the notebook opens without the draft.
    }
    router.push(`/notebooks/view/?id=${encodeURIComponent(notebook.id)}&tab=chat`)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (slash.onKeyDown(event)) return
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
    if (isTouchDevice()) return
    event.preventDefault()
    void submit()
  }

  const webResetTime = webQuota.quota ? format.time(webQuota.quota.resets_at) : "—"
  const resetTime = limit.reached && limit.resetsAt ? format.time(limit.resetsAt) : "—"
  const limitText = limit.reached
    ? limit.scope === "session"
      ? t("limitSession", { time: resetTime })
      : t("limitDay", { time: resetTime })
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
      {online ? null : (
        <div className="flex">
          <OfflineBadge />
        </div>
      )}
      <ComposerUpload ref={uploadRef} disabled={locked} onUploaded={(file) => addFiles([file])} />
      <div
        className={cn(
          "bg-muted/50 focus-within:border-ring relative focus-within:ring-ring/30 flex flex-col gap-1 rounded-[1.75rem] border p-1.5 transition-shadow focus-within:ring-3 motion-reduce:transition-none",
          locked && "opacity-70",
        )}
      >
        {slash.menu ? <SlashMenu {...slash.menu} /> : null}
        {files.length > 0 || guided || webOn || command ? (
          <div className="flex flex-wrap items-center gap-1 px-2 pt-1" aria-label={t("attached")} role="group">
            {command ? <SlashChip name={command} onRemove={() => setCommand(null)} /> : null}
            {guided ? (
              <Badge variant="secondary" className="gap-1 pe-0.5">
                <IconSchool className="size-3.5" aria-hidden />
                {t("guided")}
                <button
                  type="button"
                  className="hover:bg-background inline-flex size-6 items-center justify-center rounded-full"
                  aria-label={t("guidedOff")}
                  onClick={() => setGuided(false)}
                >
                  <IconX className="size-3.5" aria-hidden />
                </button>
              </Badge>
            ) : null}
            {webOn ? (
              <Badge variant="secondary" className="gap-1 pe-0.5">
                <IconWorld className="size-3.5" aria-hidden />
                {t("webBadge")}
                <button
                  type="button"
                  className="hover:bg-background inline-flex size-6 items-center justify-center rounded-full"
                  aria-label={t("webOff")}
                  onClick={() => setWeb(false)}
                >
                  <IconX className="size-3.5" aria-hidden />
                </button>
              </Badge>
            ) : null}
            {files.map((file) => (
              <FileChip
                key={file.id}
                file={file}
                onRemove={() => setFiles((current) => current.filter((item) => item.id !== file.id))}
              />
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-1">
          {features.plus ? (
            <ComposerPlusMenu
              disabled={locked}
              guided={guided}
              onGuidedChange={setGuided}
              web={webOn}
              onWebChange={setWeb}
              webQuota={webQuota}
              onStudyTool={pickCommand}
              fieldRef={inputRef}
              onUpload={() => uploadRef.current?.open()}
              onPickFiles={() => setPickerOpen(true)}
              onAskNotebook={askNotebook}
            />
          ) : (
            <span className="w-2 shrink-0" aria-hidden />
          )}
          <label htmlFor={inputId} className="sr-only">
            {t("label")}
          </label>
          <textarea
            id={inputId}
            ref={inputRef}
            data-assistant-composer
            value={text}
            rows={1}
            disabled={locked}
            placeholder={
              locked
                ? online
                  ? t("disabledPlaceholder")
                  : t("offline")
                : command
                  ? tSlash(`${command}.args`)
                  : placeholder
            }
            className="placeholder:text-muted-foreground field-sizing-content max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-1 py-2.5 text-base outline-none disabled:cursor-not-allowed md:text-sm"
            onChange={(event) => slash.onTextChange(event.target.value)}
            onKeyDown={onKeyDown}
            {...slash.fieldProps}
          />
          {tier ? <TierPicker value={tier.value} onChange={tier.onChange} disabled={locked} /> : null}
          {stoppable ? (
            <Button
              type="button"
              size="icon"
              className="size-11 shrink-0 rounded-full"
              aria-label={t("stop")}
              onClick={onStop}
            >
              <IconPlayerStop aria-hidden />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0 rounded-full"
              aria-label={t("send")}
              disabled={!canSend}
            >
              <IconArrowUp aria-hidden />
            </Button>
          )}
        </div>
      </div>
      {webOn && webQuota.quota ? (
        <p role="status" className="text-muted-foreground flex items-center justify-center gap-1.5 px-4 text-xs">
          <IconWorld className="size-3.5 shrink-0" aria-hidden />
          {webQuota.spent
            ? t("webNone", { time: webResetTime })
            : t("webQuota", { remaining: webQuota.remaining, limit: webQuota.quota.limit })}
        </p>
      ) : null}
      <p className="text-muted-foreground hidden truncate px-4 text-center text-[11px] sm:block">
        {tRoot("disclaimer")}
      </p>
      <AttachFilesDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        attachedIds={new Set(files.map((file) => file.id))}
        onPick={addFiles}
      />
    </form>
  )
}
