"use client"

import { useT } from "@ihsp/i18n"
import { Button, Label, Markdown, Textarea } from "@ihsp/ui"
import { IconArrowDown, IconArrowUp, IconTrash } from "@tabler/icons-react"
import { useId } from "react"
import type { EditorRow } from "../utils/editor-rows"

type CardEditorRowProps = {
  row: EditorRow
  index: number
  count: number
  invalid: boolean
  preview: boolean
  onChange: (key: string, patch: Partial<Pick<EditorRow, "front" | "back">>) => void
  onMove: (index: number, delta: -1 | 1) => void
  onRemove: (key: string) => void
}

/** One card: two Markdown fields, reorder and delete (WEB-24). */
export function CardEditorRow({ row, index, count, invalid, preview, onChange, onMove, onRemove }: CardEditorRowProps) {
  const t = useT("flashcards.editor")
  const frontId = useId()
  const backId = useId()
  const position = index + 1

  return (
    <li
      aria-label={t("cardN", { n: position })}
      data-invalid={invalid ? "true" : "false"}
      className={`bg-card flex flex-col gap-3 rounded-xl border p-3 ${invalid ? "border-destructive" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{t("cardN", { n: position })}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={t("moveUp", { n: position })}
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
          >
            <IconArrowUp aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={t("moveDown", { n: position })}
            disabled={index === count - 1}
            onClick={() => onMove(index, 1)}
          >
            <IconArrowDown aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={t("remove", { n: position })}
            onClick={() => onRemove(row.key)}
          >
            <IconTrash aria-hidden />
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={frontId}>{t("front", { n: position })}</Label>
          <Textarea
            id={frontId}
            value={row.front}
            rows={3}
            aria-invalid={invalid && row.front.trim() === ""}
            onChange={(event) => onChange(row.key, { front: event.target.value })}
          />
          {preview && row.front.trim() ? <Markdown className="bg-muted/50 rounded-md p-2">{row.front}</Markdown> : null}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={backId}>{t("back", { n: position })}</Label>
          <Textarea
            id={backId}
            value={row.back}
            rows={3}
            aria-invalid={invalid && row.back.trim() === ""}
            onChange={(event) => onChange(row.key, { back: event.target.value })}
          />
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
