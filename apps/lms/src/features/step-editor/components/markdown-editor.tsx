"use client"

import { RichTextEditor } from "@ihsp/features-core/rich-text"

/**
 * The editor of text blocks: a WYSIWYG field (bold, italic, headings, lists, quote, link, undo and redo) whose value
 * is Markdown, the stored format that the student's page renders.
 */
export function MarkdownEditor({
  value,
  onChange,
  label,
  disabled,
  rows = 8,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  disabled?: boolean
  rows?: number
}) {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      ariaLabel={label}
      disabled={disabled}
      minHeight={`${rows * 1.5}rem`}
    />
  )
}
