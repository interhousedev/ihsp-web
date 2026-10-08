"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Label, Markdown, Textarea, cn } from "@ihsp/ui"
import { useId, type ClipboardEvent, type KeyboardEvent } from "react"
import { CARD_TEXT_MAX } from "../utils/limits"
import type { EditorRow } from "../utils/editor-rows"
import { looksLikeImport } from "../utils/parse-import"

export type CardEditorRowProps = {
  row: EditorRow
  /** 0-based position; shown as `index + 1`. */
  index: number
  invalid: boolean
  preview: boolean
  autoFocus: boolean
  onChange: (key: string, patch: Partial<Pick<EditorRow, "front" | "back">>) => void
  onRemove: (key: string) => void
  /** Alt plus an arrow key on the handle: move one place up or down. */
  onMove: (index: number, delta: -1 | 1) => void
  /** Text pasted into a field that is a list of cards (term, tab, definition per line). */
  onPasteCards: (key: string, text: string) => void
}

/** One card, Quizlet style: its number, a drag handle and a delete button, then Term and Definition side by side. */
export function CardEditorRow({
  row,
  index,
  invalid,
  preview,
  autoFocus,
  onChange,
  onRemove,
  onMove,
  onPasteCards,
}: CardEditorRowProps) {
  const t = useT("flashcards.editor")
  const frontId = useId()
  const backId = useId()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: row.key,
  })
  const n = index + 1

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault()
      event.stopPropagation()
      onMove(index, event.key === "ArrowUp" ? -1 : 1)
      return
    }
    listeners?.onKeyDown?.(event)
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const text = event.clipboardData.getData("text")
    if (!looksLikeImport(text)) return
    event.preventDefault()
    onPasteCards(row.key, text)
  }

  const frontEmpty = invalid && row.front.trim() === ""
  const backEmpty = invalid && row.back.trim() === ""

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      aria-label={t("cardN", { n })}
      data-invalid={invalid ? "true" : "false"}
      data-row-key={row.key}
      className={cn(
        "bg-card flex flex-col gap-3 rounded-xl border p-3 md:p-4",
        invalid && "border-destructive",
        isDragging && "relative z-10 opacity-80 shadow-lg",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground ps-1 text-sm font-semibold tabular-nums" data-testid="card-number">
          {n}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            onKeyDown={handleKeyDown}
            aria-label={t("reorder", { n })}
            aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
            data-handle={row.key}
            className="text-muted-foreground hover:bg-muted focus-visible:ring-ring/50 flex size-11 cursor-grab touch-none items-center justify-center rounded-md outline-none focus-visible:ring-3 md:size-9"
          >
            <Icons.gripVertical className="size-5" aria-hidden />
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-11 md:size-9"
            aria-label={t("remove", { n })}
            onClick={() => onRemove(row.key)}
          >
            <Icons.trash aria-hidden />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Textarea
            id={frontId}
            value={row.front}
            rows={2}
            maxLength={CARD_TEXT_MAX}
            autoFocus={autoFocus}
            placeholder={t("enterTerm")}
            aria-invalid={frontEmpty}
            onPaste={handlePaste}
            onChange={(event) => onChange(row.key, { front: event.target.value })}
          />
          <Label htmlFor={frontId} className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            {t("term")}
            <span className="sr-only"> {n}</span>
          </Label>
          {preview && row.front.trim() ? <Markdown className="bg-muted/50 rounded-md p-2">{row.front}</Markdown> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <Textarea
            id={backId}
            value={row.back}
            rows={2}
            maxLength={CARD_TEXT_MAX}
            placeholder={t("enterDefinition")}
            aria-invalid={backEmpty}
            onPaste={handlePaste}
            onChange={(event) => onChange(row.key, { back: event.target.value })}
          />
          <Label htmlFor={backId} className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            {t("definition")}
            <span className="sr-only"> {n}</span>
          </Label>
          {preview && row.back.trim() ? <Markdown className="bg-muted/50 rounded-md p-2">{row.back}</Markdown> : null}
        </div>
      </div>

      {invalid ? (
        <p role="alert" className="text-destructive text-xs">
          {t("incomplete")}
        </p>
      ) : null}
    </li>
  )
}
