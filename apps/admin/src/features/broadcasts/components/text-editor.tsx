"use client"

import { useT } from "@ihsp/i18n"
import { Button, Textarea } from "@ihsp/ui"
import { IconBold, IconItalic, IconLink, IconUnderline } from "@ihsp/ui"
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { TEXT_MAX, wrapSelection } from "../utils/broadcast-form"

type Tool = "b" | "i" | "u" | "k"

/**
 * Message text with a toolbar for bold, italic, underline and link (Telegram HTML). The buttons wrap the selected
 * text in tags, so the author never types markup by hand. The toolbar is one tab stop (arrow keys move inside it) and
 * the same tools answer to Ctrl/Cmd+B, I, U and K in the text field.
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
  const [focused, setFocused] = useState(0)

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

  const tools: { key: Tool; label: string; shortcut: string; run: () => void; icon: ReactNode }[] = [
    {
      key: "b",
      label: t("bold"),
      shortcut: "Control+B Meta+B",
      run: () => apply("<b>", "</b>", t("boldText")),
      icon: <IconBold aria-hidden />,
    },
    {
      key: "i",
      label: t("italic"),
      shortcut: "Control+I Meta+I",
      run: () => apply("<i>", "</i>", t("italicText")),
      icon: <IconItalic aria-hidden />,
    },
    {
      key: "u",
      label: t("underline"),
      shortcut: "Control+U Meta+U",
      run: () => apply("<u>", "</u>", t("underlineText")),
      icon: <IconUnderline aria-hidden />,
    },
    { key: "k", label: t("link"), shortcut: "Control+K Meta+K", run: link, icon: <IconLink aria-hidden /> },
  ]

  /** Ctrl/Cmd + B, I, U, K in the text field run the matching tool. */
  function shortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || disabled) return
    const tool = tools.find((item) => item.key === event.key.toLowerCase())
    if (!tool) return
    event.preventDefault()
    tool.run()
  }

  /** Arrow keys move between the buttons of the toolbar (one tab stop for the whole toolbar). */
  function roam(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") return
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button")]
    const index = buttons.findIndex((button) => button === document.activeElement)
    if (index < 0) return
    event.preventDefault()
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length
    setFocused(next)
    buttons[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" tabIndex={-1} aria-label={t("formatting")} className="flex flex-wrap gap-1" onKeyDown={roam}>
        {tools.map((tool, index) => (
          <Button
            key={tool.key}
            type="button"
            variant="outline"
            size="icon"
            tabIndex={index === focused ? 0 : -1}
            disabled={disabled}
            aria-label={tool.label}
            aria-keyshortcuts={tool.shortcut}
            title={`${tool.label} (Ctrl+${tool.key.toUpperCase()})`}
            onClick={tool.run}
          >
            {tool.icon}
          </Button>
        ))}
      </div>
      <Textarea
        id={id}
        ref={ref}
        value={value}
        rows={8}
        maxLength={TEXT_MAX}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={shortcut}
      />
      <p className="text-muted-foreground text-end text-xs">
        {value.length}/{TEXT_MAX}
      </p>
    </div>
  )
}
