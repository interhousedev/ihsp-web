"use client"

import { useT } from "@ihsp/i18n"
import {
  IconBold,
  IconCode,
  IconEyeOff,
  IconItalic,
  IconLink,
  IconMathFunction,
  IconQuote,
  IconStrikethrough,
  IconUnderline,
} from "@ihsp/ui"
import type { Ref } from "react"
import { shortcutOf } from "../utils/editor-shortcuts"
import type { InlineFormat } from "../utils/markdown/markdown-index"
import { EditorToolbar } from "./editor-toolbar"
import { ToolbarButton } from "./toolbar-button"

const FORMATS = [
  { format: "bold", icon: IconBold },
  { format: "italic", icon: IconItalic },
  { format: "underline", icon: IconUnderline },
  { format: "strike", icon: IconStrikethrough },
  { format: "code", icon: IconCode },
  { format: "spoiler", icon: IconEyeOff },
] as const satisfies readonly { format: InlineFormat; icon: unknown }[]

/**
 * The floating toolbar over selected text (like Telegram's): inline formats, link, quote and equation. It shows the
 * formats of the selection as pressed buttons.
 */
export function SelectionToolbar({
  toolbarRef,
  position,
  active,
  linked,
  quoted,
  onFormat,
  onLink,
  onQuote,
  onEquation,
  onEscape,
}: {
  toolbarRef: Ref<HTMLDivElement>
  /** Where to draw it inside the text box; `null` while it is being measured. */
  position: { top: number; left: number } | null
  active: ReadonlySet<InlineFormat>
  linked: boolean
  quoted: boolean
  onFormat: (format: InlineFormat) => void
  onLink: () => void
  onQuote: () => void
  onEquation: () => void
  onEscape: () => void
}) {
  const t = useT("markdownEditor")
  return (
    <div
      ref={toolbarRef}
      data-testid="selection-toolbar"
      className="bg-popover text-popover-foreground ring-foreground/10 animate-in fade-in-0 zoom-in-95 absolute z-20 max-w-full rounded-lg p-0.5 shadow-lg ring-1 duration-100"
      style={position ? { top: position.top, left: position.left } : { top: 0, left: 0, visibility: "hidden" }}
    >
      <EditorToolbar label={t("selectionToolbar")} onEscape={onEscape} className="flex-wrap">
        {FORMATS.map(({ format, icon }) => (
          <ToolbarButton
            key={format}
            label={t(format)}
            icon={icon}
            pressed={active.has(format)}
            shortcut={shortcutOf(format)}
            onPress={() => onFormat(format)}
          />
        ))}
        <span aria-hidden className="bg-border mx-0.5 h-5 w-px shrink-0" />
        <ToolbarButton
          label={t("link")}
          icon={IconLink}
          pressed={linked}
          shortcut={shortcutOf("link")}
          onPress={onLink}
        />
        <ToolbarButton label={t("quote")} icon={IconQuote} pressed={quoted} onPress={onQuote} />
        <ToolbarButton
          label={t("equation")}
          icon={IconMathFunction}
          shortcut={shortcutOf("equation")}
          onPress={onEquation}
        />
      </EditorToolbar>
    </div>
  )
}
