"use client"

import { useT } from "@ihsp/i18n"
import { RichTextEditor, type RichTextMode } from "../../rich-text"
import { MARKDOWN_MAX } from "./upload-config"

/**
 * The notes field of an upload: a Markdown field (text and a live preview with formulas) that can switch to a WYSIWYG
 * editor (bold, italic, headings, lists, quote, link) when the text allows it. The value is Markdown, the format the
 * readers render.
 */
export function MarkdownEditor({
  value,
  onChange,
  label,
  defaultMode,
  invalid = false,
  describedBy,
  disabled = false,
  rows = 14,
  maxLength = MARKDOWN_MAX,
}: {
  value: string
  onChange: (value: string) => void
  /** The accessible name of the text field. */
  label: string
  /** The mode a value that the visual editor can hold opens in: descriptions open visual, Markdown notes as Markdown. */
  defaultMode: RichTextMode
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
  rows?: number
  maxLength?: number
}) {
  const t = useT("library.upload.markdownEditor")
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      ariaLabel={label}
      defaultMode={defaultMode}
      previewLabel={t("previewLabel")}
      invalid={invalid}
      describedBy={describedBy}
      disabled={disabled}
      maxLength={maxLength}
      minHeight={`${rows * 1.5}rem`}
    />
  )
}
