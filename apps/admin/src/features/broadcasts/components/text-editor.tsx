"use client"

import { useT } from "@ihsp/i18n"
import { Button, Textarea } from "@ihsp/ui"
import { IconBold, IconItalic, IconLink, IconUnderline } from "@ihsp/ui"
import { useRef } from "react"
import { TEXT_MAX, wrapSelection } from "../utils/broadcast-form"

/**
 * Message text with a toolbar for bold, italic, underline and link (Telegram HTML). The buttons wrap the selected
 * text in tags, so the author never types markup by hand.
 */
export function TextEditor({
  value,
  onChange,
  disabled,
  id,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id: string
}) {
  const t = useT("broadcasts.editor")
  const ref = useRef<HTMLTextAreaElement>(null)

  function apply(open: string, close: string, placeholder: string) {
    const area = ref.current
    const start = area?.selectionStart ?? value.length
    const end = area?.selectionEnd ?? value.length
    const next = wrapSelection(value, start, end, open, close, placeholder)
    onChange(next.text)
    requestAnimationFrame(() => {
      area?.focus()
      area?.setSelectionRange(next.selectionStart, next.selectionEnd)
    })
  }

  function link() {
    const href = window.prompt(t("linkPrompt"), "https://")
    if (!href || !/^https?:\/\//i.test(href.trim())) return
    apply(`<a href="${href.trim().replaceAll('"', "&quot;")}">`, "</a>", t("linkText"))
  }

  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label={t("formatting")} className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          disabled={disabled}
          aria-label={t("bold")}
          onClick={() => apply("<b>", "</b>", t("boldText"))}
        >
          <IconBold aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          disabled={disabled}
          aria-label={t("italic")}
          onClick={() => apply("<i>", "</i>", t("italicText"))}
        >
          <IconItalic aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          disabled={disabled}
          aria-label={t("underline")}
          onClick={() => apply("<u>", "</u>", t("underlineText"))}
        >
          <IconUnderline aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          disabled={disabled}
          aria-label={t("link")}
          onClick={link}
        >
          <IconLink aria-hidden />
        </Button>
      </div>
      <Textarea
        id={id}
        ref={ref}
        value={value}
        rows={8}
        maxLength={TEXT_MAX}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-muted-foreground text-end text-xs">
        {value.length}/{TEXT_MAX}
      </p>
    </div>
  )
}
