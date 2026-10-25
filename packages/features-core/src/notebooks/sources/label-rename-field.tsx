"use client"

import { useT } from "@ihsp/i18n"
import { Input } from "@ihsp/ui"
import { useEffect, useRef, type KeyboardEvent } from "react"

const NAME_MAX = 40

type LabelRenameFieldProps = {
  name: string
  /** Enter or leaving the field with a new, non-empty name. */
  onSave: (name: string) => void
  /** Esc, or leaving the field unchanged. */
  onCancel: () => void
}

/** The name of a topic group edited in place: Enter saves, Esc cancels, leaving the field saves a changed name. */
export function LabelRenameField({ name, onSave, onCancel }: LabelRenameFieldProps) {
  const t = useT("notebooks")
  const input = useRef<HTMLInputElement>(null)
  const done = useRef(false)

  useEffect(() => {
    input.current?.focus()
    input.current?.select()
  }, [])

  function finish(save: boolean) {
    if (done.current) return
    done.current = true
    const next = input.current?.value.trim() ?? ""
    if (save && next !== "" && next !== name) onSave(next)
    else onCancel()
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      finish(true)
    } else if (event.key === "Escape") {
      event.stopPropagation()
      finish(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-1 items-center px-1">
      <Input
        ref={input}
        type="text"
        defaultValue={name}
        maxLength={NAME_MAX}
        aria-label={t("label.nameField")}
        className="h-9 text-sm md:h-8"
        onKeyDown={onKeyDown}
        onBlur={() => finish(true)}
      />
    </div>
  )
}
