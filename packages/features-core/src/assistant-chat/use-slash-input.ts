"use client"

import { useT } from "@ihsp/i18n"
import { useId, useMemo, useState, type KeyboardEvent, type RefObject } from "react"
import { filterSlash, isSlashName, slashQuery, type SlashName } from "./slash-commands"
import { slashOptionId } from "./slash-menu"

type Options = {
  text: string
  setText: (text: string) => void
  command: SlashName | null
  setCommand: (command: SlashName | null) => void
  fieldRef: RefObject<HTMLTextAreaElement | null>
  disabled?: boolean
}

/**
 * The slash behaviour shared by every composer. Typing `/` at the start of an empty field opens the command menu,
 * which narrows as you type; arrows move, Enter or Tab picks, Escape closes. A pick turns into a chip (`command`) and
 * the field is left for the arguments; Backspace in an empty field removes the chip. Typing a whole `/cards ` also
 * becomes the chip. Spread `fieldProps` on the textarea and render `<SlashMenu {...menu} />` when `menu` is not null.
 */
export function useSlashInput({ text, setText, command, setCommand, fieldRef, disabled = false }: Options) {
  const t = useT("assistant.slash")
  const id = useId()
  const [active, setActive] = useState(0)
  const [dismissed, setDismissed] = useState<string | null>(null)

  const query = command === null && !disabled ? slashQuery(text) : null
  const items = useMemo(
    () =>
      query === null ? [] : filterSlash(query, (name) => ({ title: t(`${name}.title`), hint: t(`${name}.hint`) })),
    [query, t],
  )
  const open = query !== null && dismissed !== text
  const current = Math.min(active, Math.max(items.length - 1, 0))

  function pick(name: SlashName) {
    setCommand(name)
    setText("")
    setDismissed(null)
    setActive(0)
    fieldRef.current?.focus()
  }

  /** Call from `onChange`: turns a typed `/cards ` into the chip, otherwise just stores the text. */
  function onTextChange(value: string) {
    setActive(0)
    if (command === null && !disabled) {
      const typed = /^\/([A-Za-z]+)\s([\s\S]*)$/.exec(value)
      const name = typed?.[1]?.toLowerCase()
      if (typed && name && isSlashName(name)) {
        setCommand(name)
        setText((typed[2] ?? "").trimStart())
        return
      }
    }
    setText(value)
  }

  /** Call first in `onKeyDown`; returns `true` when the key was used by the menu or the chip. */
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): boolean {
    if (event.nativeEvent.isComposing) return false
    if (open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        if (items.length === 0) return true
        const step = event.key === "ArrowDown" ? 1 : -1
        setActive((current + step + items.length) % items.length)
        return true
      }
      if ((event.key === "Enter" || event.key === "Tab") && !event.shiftKey) {
        event.preventDefault()
        const chosen = items[current]
        if (chosen) pick(chosen.name)
        return true
      }
      if (event.key === "Escape") {
        event.preventDefault()
        setDismissed(text)
        return true
      }
    }
    if (
      event.key === "Backspace" &&
      command !== null &&
      event.currentTarget.selectionStart === 0 &&
      event.currentTarget.selectionEnd === 0
    ) {
      event.preventDefault()
      setCommand(null)
      return true
    }
    return false
  }

  const menu = open ? { id, items, active: current, onPick: pick, onHover: setActive } : null
  const fieldProps = {
    "aria-autocomplete": "list" as const,
    "aria-controls": open ? id : undefined,
    "aria-activedescendant": open && items.length > 0 ? slashOptionId(id, current) : undefined,
  }
  return { menu, fieldProps, onTextChange, onKeyDown, pick }
}
