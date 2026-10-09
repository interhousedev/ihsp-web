"use client"

import type { AnnotationColor } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, cn, useIsMobile } from "@ihsp/ui"
import { IconCopy, IconNotebook, IconPencil, IconX } from "@tabler/icons-react"
import { ANNOTATION_COLORS, COLOR_ICONS, COLOR_TEXT } from "./lib/colors"
import type { ReaderSelection } from "./reader-types"

export type SelectionToolbarProps = {
  selection: ReaderSelection
  /** Highlight and Note need an account; a visitor can still copy. */
  canAnnotate: boolean
  canNotebook: boolean
  /** The colour of the last highlight, marked on its button. */
  color: AnnotationColor
  onHighlight(color: AnnotationColor): void
  onNote(): void
  onCopy(): void
  onNotebook(): void
  onDismiss(): void
}

const TOOLBAR_HEIGHT = 52
const HALF_WIDTH = 170

/**
 * The actions for the selected text: Highlight in four colours (each with its own shape), Note, Copy and Add to
 * notebook. Next to the selection on wide screens, a bar above the footer on phones (a finger covers the text, and the
 * system's own selection menu sits near it). The buttons keep the selection alive when pressed.
 */
export function SelectionToolbar({
  selection,
  canAnnotate,
  canNotebook,
  color,
  onHighlight,
  onNote,
  onCopy,
  onNotebook,
  onDismiss,
}: SelectionToolbarProps) {
  const t = useT("library.annotation")
  const mobile = useIsMobile()
  const { rect } = selection

  const style = mobile
    ? undefined
    : {
        left: Math.min(
          Math.max(rect.left + rect.width / 2, HALF_WIDTH),
          Math.max(window.innerWidth - HALF_WIDTH, HALF_WIDTH),
        ),
        top: rect.top - TOOLBAR_HEIGHT - 8 >= 8 ? rect.top - TOOLBAR_HEIGHT - 8 : rect.top + rect.height + 8,
      }

  return (
    <div
      role="toolbar"
      tabIndex={-1}
      aria-label={t("selection")}
      // A press on a button must not clear the text that was selected.
      onMouseDown={(event) => event.preventDefault()}
      style={style}
      className={cn(
        "bg-popover text-popover-foreground ring-foreground/10 z-50 flex flex-wrap items-center gap-1 rounded-xl p-1 shadow-lg ring-1",
        mobile
          ? "fixed inset-x-2 bottom-[calc(4.25rem+var(--safe-bottom,0px))] justify-center"
          : "fixed -translate-x-1/2",
      )}
    >
      {canAnnotate ? (
        <div role="group" aria-label={t("highlight")} className="flex items-center">
          {ANNOTATION_COLORS.map((name) => {
            const Icon = COLOR_ICONS[name]
            return (
              <Button
                key={name}
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${t("highlight")}: ${t(`color.${name}`)}`}
                title={`${t("highlight")}: ${t(`color.${name}`)}`}
                data-color={name}
                aria-pressed={name === color}
                className="size-11 md:size-8"
                onClick={() => onHighlight(name)}
              >
                <Icon className={cn("size-5 md:size-4", COLOR_TEXT[name])} aria-hidden />
              </Button>
            )
          })}
        </div>
      ) : null}
      {canAnnotate ? (
        <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={onNote}>
          <IconPencil aria-hidden />
          {t("note")}
        </Button>
      ) : null}
      <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={onCopy}>
        <IconCopy aria-hidden />
        {t("copy")}
      </Button>
      {canNotebook ? (
        <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={onNotebook}>
          <IconNotebook aria-hidden />
          {t("addToNotebook")}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("dismiss")}
        className="size-11 md:size-8"
        onClick={onDismiss}
      >
        <IconX aria-hidden />
      </Button>
    </div>
  )
}
