"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconCode,
  IconItalic,
  IconLink,
  IconLinkOff,
  IconList,
  IconListNumbers,
  IconSum,
  IconQuote,
  IconSourceCode,
  IconTable,
  IconUnderline,
} from "@ihsp/ui"
import { type Ref, type ReactNode } from "react"
import { shortcutOf } from "../utils/editor-shortcuts"
import type { BlockFormat } from "../utils/markdown/block-format"
import type { InlineFormat } from "../utils/markdown/markdown-index"
import type { Align, Color } from "../utils/markdown/rich-format"
import { EditorToolbar } from "./editor-toolbar"
import { ToolbarButton } from "./toolbar-button"

export const COLORS: readonly Color[] = ["red", "orange", "green", "blue", "purple", "gray"]

const SWATCH: Record<Color, string> = {
  red: "bg-red-600",
  orange: "bg-orange-500",
  green: "bg-green-600",
  blue: "bg-blue-600",
  purple: "bg-purple-600",
  gray: "bg-gray-500",
}

export type Paragraph = "paragraph" | "heading1" | "heading2" | "heading3"

function Divider() {
  return <span aria-hidden className="bg-border mx-0.5 h-5 w-px shrink-0 md:mx-1" />
}

/**
 * The toolbar above the text, Stepik style: undo / redo, a paragraph select, bold, italic, underline and code, text
 * colour, lists, quote, alignment, link / unlink, image, formula, table and code block.
 */
export function BlockToolbar({
  toolbarRef,
  blocks,
  inline,
  inCodeBlock,
  linked,
  align,
  color,
  disabled,
  onBlock,
  onParagraph,
  onFormat,
  onUndo,
  onRedo,
  onColor,
  onAlign,
  onLink,
  onUnlink,
  onImage,
  onEquation,
  onTable,
  onCodeBlock,
  onEscape,
  trailing,
}: {
  toolbarRef: Ref<HTMLDivElement>
  blocks: ReadonlySet<BlockFormat>
  inline: ReadonlySet<InlineFormat>
  inCodeBlock: boolean
  linked: boolean
  align: Align | null
  color: string | null
  disabled?: boolean
  onBlock: (format: BlockFormat) => void
  onParagraph: (paragraph: Paragraph) => void
  onFormat: (format: InlineFormat) => void
  onUndo: () => void
  onRedo: () => void
  onColor: (color: Color | null) => void
  onAlign: (align: Align) => void
  onLink: () => void
  onUnlink: () => void
  onImage: ReactNode
  onEquation: () => void
  onTable: () => void
  onCodeBlock: () => void
  onEscape: () => void
  trailing?: ReactNode
}) {
  const t = useT("markdownEditor")
  const paragraph: Paragraph = blocks.has("heading1")
    ? "heading1"
    : blocks.has("heading2")
      ? "heading2"
      : blocks.has("heading3")
        ? "heading3"
        : "paragraph"
  return (
    <div ref={toolbarRef} className="order-last w-full min-w-0 overflow-x-auto md:order-none md:w-auto md:flex-1">
      <EditorToolbar label={t("toolbar")} onEscape={onEscape} className="gap-0 md:gap-0.5">
        <ToolbarButton
          label={t("undo")}
          icon={IconArrowBackUp}
          disabled={disabled}
          onPress={onUndo}
          shortcut={{ key: "z" }}
        />
        <ToolbarButton
          label={t("redo")}
          icon={IconArrowForwardUp}
          disabled={disabled}
          onPress={onRedo}
          shortcut={{ key: "z", shift: true }}
        />
        <Divider />
        <select
          aria-label={t("paragraphStyle")}
          title={t("paragraphStyle")}
          value={paragraph}
          disabled={disabled}
          data-toolbar-item=""
          onChange={(event) => onParagraph(event.target.value as Paragraph)}
          className="bg-background focus-visible:ring-ring/50 h-11 shrink-0 rounded-md border px-1.5 text-xs outline-none focus-visible:ring-2 md:pointer-fine:h-8"
        >
          <option value="paragraph">{t("paragraph")}</option>
          <option value="heading1">{t("heading1")}</option>
          <option value="heading2">{t("heading2")}</option>
          <option value="heading3">{t("heading3")}</option>
        </select>
        <Divider />
        <ToolbarButton
          label={t("bold")}
          icon={IconBold}
          pressed={inline.has("bold")}
          disabled={disabled}
          shortcut={shortcutOf("bold")}
          onPress={() => onFormat("bold")}
        />
        <ToolbarButton
          label={t("italic")}
          icon={IconItalic}
          pressed={inline.has("italic")}
          disabled={disabled}
          shortcut={shortcutOf("italic")}
          onPress={() => onFormat("italic")}
        />
        <ToolbarButton
          label={t("underline")}
          icon={IconUnderline}
          pressed={inline.has("underline")}
          disabled={disabled}
          shortcut={shortcutOf("underline")}
          onPress={() => onFormat("underline")}
        />
        <ToolbarButton
          label={t("code")}
          icon={IconCode}
          pressed={inline.has("code")}
          disabled={disabled}
          shortcut={shortcutOf("code")}
          onPress={() => onFormat("code")}
        />
        <Divider />
        <div role="group" aria-label={t("textColor")} className="flex shrink-0 items-center">
          {COLORS.map((name) => (
            <button
              key={name}
              type="button"
              data-toolbar-item=""
              disabled={disabled}
              title={t(`colors.${name}`)}
              aria-label={t(`colors.${name}`)}
              aria-pressed={color === name}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onColor(color === name ? null : name)}
              className="focus-visible:ring-ring/50 flex size-8 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-2 disabled:opacity-50 md:pointer-fine:size-6"
            >
              <span
                aria-hidden
                className={cn(
                  "size-3.5 rounded-full ring-offset-1 ring-offset-background",
                  SWATCH[name],
                  color === name && "ring-foreground ring-2",
                )}
              />
            </button>
          ))}
        </div>
        <Divider />
        <ToolbarButton
          label={t("orderedList")}
          icon={IconListNumbers}
          pressed={blocks.has("orderedList")}
          disabled={disabled}
          onPress={() => onBlock("orderedList")}
        />
        <ToolbarButton
          label={t("bulletList")}
          icon={IconList}
          pressed={blocks.has("bulletList")}
          disabled={disabled}
          onPress={() => onBlock("bulletList")}
        />
        <ToolbarButton
          label={t("quote")}
          icon={IconQuote}
          pressed={blocks.has("quote")}
          disabled={disabled}
          onPress={() => onBlock("quote")}
        />
        <Divider />
        <ToolbarButton
          label={t("alignLeft")}
          icon={IconAlignLeft}
          pressed={align === "left"}
          disabled={disabled}
          onPress={() => onAlign("left")}
        />
        <ToolbarButton
          label={t("alignCenter")}
          icon={IconAlignCenter}
          pressed={align === "center"}
          disabled={disabled}
          onPress={() => onAlign("center")}
        />
        <ToolbarButton
          label={t("alignRight")}
          icon={IconAlignRight}
          pressed={align === "right"}
          disabled={disabled}
          onPress={() => onAlign("right")}
        />
        <Divider />
        <ToolbarButton
          label={t("link")}
          icon={IconLink}
          pressed={linked}
          disabled={disabled}
          shortcut={shortcutOf("link")}
          onPress={onLink}
        />
        <ToolbarButton label={t("unlink")} icon={IconLinkOff} disabled={disabled || !linked} onPress={onUnlink} />
        {onImage}
        <ToolbarButton
          label={t("displayEquation")}
          icon={IconSum}
          disabled={disabled}
          shortcut={shortcutOf("equation")}
          onPress={onEquation}
        />
        <ToolbarButton label={t("table")} icon={IconTable} disabled={disabled} onPress={onTable} />
        <ToolbarButton
          label={t("codeBlock")}
          icon={IconSourceCode}
          pressed={inCodeBlock}
          disabled={disabled}
          onPress={onCodeBlock}
        />
        {trailing}
      </EditorToolbar>
    </div>
  )
}
