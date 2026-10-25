"use client"

import { useT } from "@ihsp/i18n"
import { Button, Markdown, Textarea, cn, useIsMobile } from "@ihsp/ui"
import {
  IconBold,
  IconCode,
  IconHeading,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconMathFunction,
  IconQuote,
  IconSum,
  type Icon,
} from "@ihsp/ui"
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
import { applyFormat, type FormatAction } from "./markdown-format"
import { MARKDOWN_MAX } from "./upload-config"

const TOOLS: readonly { action: FormatAction; icon: Icon }[] = [
  { action: "bold", icon: IconBold },
  { action: "italic", icon: IconItalic },
  { action: "heading", icon: IconHeading },
  { action: "bullet", icon: IconList },
  { action: "numbered", icon: IconListNumbers },
  { action: "quote", icon: IconQuote },
  { action: "link", icon: IconLink },
  { action: "code", icon: IconCode },
  { action: "math", icon: IconMathFunction },
  { action: "mathBlock", icon: IconSum },
]

/**
 * A Markdown field for notes: a textarea with a small toolbar (bold, italic, heading, lists, quote, link, code, formula
 * and display formula) and a live preview rendered by the same safe `Markdown` that readers see, so `$x^2$` and
 * `$$…$$` work. Wide screens show the preview beside the text; phones switch between Write and Preview.
 */
export function MarkdownEditor({
  value,
  onChange,
  label,
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
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
  rows?: number
  maxLength?: number
}) {
  const t = useT("library.upload.markdownEditor")
  const id = useId()
  const split = !useIsMobile()
  const [mode, setMode] = useState<"write" | "preview">("write")
  const ref = useRef<HTMLTextAreaElement>(null)
  const selection = useRef<{ start: number; end: number } | null>(null)

  // The textarea is controlled, so the selection that a command wants is applied after React wrote the new text.
  useLayoutEffect(() => {
    const wanted = selection.current
    const field = ref.current
    if (!wanted || !field) return
    selection.current = null
    field.focus()
    field.setSelectionRange(wanted.start, wanted.end)
  })

  function format(action: FormatAction) {
    const field = ref.current
    const start = field?.selectionStart ?? value.length
    const end = field?.selectionEnd ?? value.length
    const edit = applyFormat(value, start, end, action, {
      text: t("placeholder.text"),
      formula: t("placeholder.formula"),
      url: t("placeholder.url"),
    })
    selection.current = { start: edit.start, end: edit.end }
    onChange(edit.text)
    // Same text (a command that changed nothing): the effect above does not run, so move the cursor here.
    if (edit.text === value && field) {
      field.focus()
      field.setSelectionRange(edit.start, edit.end)
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return
    const key = event.key.toLowerCase()
    if (key === "b" || key === "i") {
      event.preventDefault()
      format(key === "b" ? "bold" : "italic")
    }
  }

  const showWrite = split || mode === "write"
  const showPreview = split || mode === "preview"
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="toolbar" aria-label={t("toolbar")} aria-controls={id} className="flex flex-wrap gap-1">
          {TOOLS.map(({ action, icon: ToolIcon }) => (
            <Button
              key={action}
              type="button"
              variant="outline"
              size="icon"
              className="size-11 md:size-8"
              disabled={disabled || (!split && mode === "preview")}
              aria-label={t(`tool.${action}`)}
              title={t(`tool.${action}`)}
              onClick={() => format(action)}
            >
              <ToolIcon aria-hidden />
            </Button>
          ))}
        </div>
        {split ? null : (
          <div role="group" aria-label={t("view")} className="flex gap-1">
            {(["write", "preview"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={mode === value ? "default" : "outline"}
                aria-pressed={mode === value}
                className="min-h-11 rounded-full px-4"
                onClick={() => setMode(value)}
              >
                {t(value)}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className={cn("grid gap-3", split && "md:grid-cols-2")}>
        {showWrite ? (
          <div className="flex min-w-0 flex-col gap-1">
            <Textarea
              id={id}
              ref={ref}
              value={value}
              rows={rows}
              maxLength={maxLength}
              disabled={disabled}
              spellCheck
              aria-label={label}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className="min-h-64 font-mono"
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={onKeyDown}
            />
            <p className="text-muted-foreground text-xs">{t("hint")}</p>
          </div>
        ) : null}
        {showPreview ? (
          <section aria-label={t("previewLabel")} className="min-h-24 min-w-0 rounded-lg border p-3">
            {value.trim() === "" ? (
              <p className="text-muted-foreground text-sm italic">{t("empty")}</p>
            ) : (
              <Markdown>{value}</Markdown>
            )}
          </section>
        ) : null}
      </div>
    </div>
  )
}
