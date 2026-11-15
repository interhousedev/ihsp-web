"use client"

import type { MarkupTool } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconArrowUpRight,
  IconBallpen,
  IconCircle,
  IconDeviceFloppy,
  IconEraser,
  IconHighlight,
  IconLine,
  IconPencil,
  IconSquare,
  IconX,
  cn,
} from "@ihsp/ui"
import type { ComponentType } from "react"
import { MARKUP_COLORS } from "./lib/colors"
import { MARKUP_WIDTHS } from "./lib/markup"
import type { ReaderMarkup } from "./use-reader-markup"

export type MarkupToolChoice = MarkupTool | "eraser"

const TOOLS: readonly { tool: MarkupToolChoice; Icon: ComponentType<{ "aria-hidden"?: boolean }> }[] = [
  { tool: "pen", Icon: IconBallpen },
  { tool: "pencil", Icon: IconPencil },
  { tool: "highlighter", Icon: IconHighlight },
  { tool: "rect", Icon: IconSquare },
  { tool: "ellipse", Icon: IconCircle },
  { tool: "line", Icon: IconLine },
  { tool: "arrow", Icon: IconArrowUpRight },
  { tool: "eraser", Icon: IconEraser },
]

const WIDTH_NAMES = ["thin", "medium", "thick"] as const
const BUTTON = "size-11 shrink-0 md:size-8"

/** The strip under the top bar with the drawing tools: tool, colour, width, undo / redo, temporary mode, save. */
export function MarkupToolbar({
  markup,
  tool,
  onTool,
  color,
  onColor,
  width,
  onWidth,
  onClose,
}: {
  markup: ReaderMarkup
  tool: MarkupToolChoice | null
  onTool(tool: MarkupToolChoice | null): void
  color: string
  onColor(color: string): void
  width: number
  onWidth(width: number): void
  onClose(): void
}) {
  const t = useT("library.reader")
  return (
    <div
      role="toolbar"
      aria-label={t("markupTools")}
      data-markup-toolbar
      className="bg-background flex shrink-0 items-center gap-1 overflow-x-auto border-b px-2"
    >
      {TOOLS.map(({ tool: id, Icon }) => (
        <Button
          key={id}
          type="button"
          variant={tool === id ? "secondary" : "ghost"}
          size="icon"
          aria-label={t(`tool.${id}`)}
          aria-pressed={tool === id}
          className={BUTTON}
          onClick={() => onTool(tool === id ? null : id)}
        >
          <Icon aria-hidden />
        </Button>
      ))}
      <span className="bg-border mx-1 h-6 w-px shrink-0" aria-hidden />
      {MARKUP_COLORS.map((value) => (
        <button
          key={value}
          type="button"
          aria-label={t("markupColor", { color: value })}
          aria-pressed={color === value}
          onClick={() => onColor(value)}
          className="flex size-11 shrink-0 items-center justify-center md:size-8"
        >
          <span
            className={cn("size-5 rounded-full border", color === value && "ring-ring ring-2 ring-offset-1")}
            style={{ backgroundColor: value }}
          />
        </button>
      ))}
      <span className="bg-border mx-1 h-6 w-px shrink-0" aria-hidden />
      {MARKUP_WIDTHS.map((value, index) => (
        <Button
          key={value}
          type="button"
          variant={width === value ? "secondary" : "ghost"}
          size="icon"
          aria-label={t(`width.${WIDTH_NAMES[index]}`)}
          aria-pressed={width === value}
          className={BUTTON}
          onClick={() => onWidth(value)}
        >
          <span className="bg-foreground block rounded-full" style={{ width: 8 + index * 5, height: 2 + index * 2 }} />
        </Button>
      ))}
      <span className="bg-border mx-1 h-6 w-px shrink-0" aria-hidden />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("undo")}
        disabled={!markup.canUndo}
        className={BUTTON}
        onClick={markup.undo}
      >
        <IconArrowBackUp aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("redo")}
        disabled={!markup.canRedo}
        className={BUTTON}
        onClick={markup.redo}
      >
        <IconArrowForwardUp aria-hidden />
      </Button>
      <span className="bg-border mx-1 h-6 w-px shrink-0" aria-hidden />
      <Button
        type="button"
        variant={markup.temporary ? "secondary" : "ghost"}
        aria-pressed={markup.temporary}
        disabled={!markup.canPersist}
        className="min-h-11 shrink-0 text-xs md:min-h-8"
        onClick={() => markup.setTemporary(!markup.temporary)}
      >
        {t("markupTemporary")}
      </Button>
      {markup.canPersist && !markup.temporary ? (
        <Button
          type="button"
          variant="ghost"
          disabled={markup.saving || !markup.unsaved}
          className="min-h-11 shrink-0 gap-1 text-xs md:min-h-8"
          onClick={() => void markup.save()}
        >
          <IconDeviceFloppy aria-hidden className="size-4" />
          {markup.failed ? t("markupSaveFailed") : t("markupSave")}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("markupClose")}
        className={BUTTON}
        onClick={onClose}
      >
        <IconX aria-hidden />
      </Button>
    </div>
  )
}
