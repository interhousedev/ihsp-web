"use client"

import { useT } from "@ihsp/i18n"
import { Input } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"

const TITLE_MAX = 200

type TitleEditorProps = {
  title: string
  onSave: (title: string) => void
}

/** The notebook title: a button that turns into an input; Enter or leaving saves, Esc cancels. */
export function TitleEditor({ title, onSave }: TitleEditorProps) {
  const t = useT("notebooks")
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const input = useRef<HTMLInputElement>(null)
  const cancelled = useRef(false)

  useEffect(() => {
    if (!editing) return
    input.current?.focus()
    input.current?.select()
  }, [editing])

  function start() {
    cancelled.current = false
    setDraft(title)
    setEditing(true)
  }

  function commit() {
    if (cancelled.current) return
    setEditing(false)
    const next = draft.trim()
    if (next !== "" && next !== title) onSave(next)
  }

  if (!editing) {
    return (
      <button
        type="button"
        title={t("workspace.rename")}
        className="hover:bg-muted focus-visible:ring-ring min-h-11 min-w-0 truncate rounded-lg px-2 text-start text-base font-semibold outline-none focus-visible:ring-2 md:min-h-9"
        onClick={start}
      >
        {title}
        <span className="sr-only">{t("workspace.rename")}</span>
      </button>
    )
  }

  return (
    <Input
      ref={input}
      value={draft}
      maxLength={TITLE_MAX}
      aria-label={t("workspace.rename")}
      className="min-h-11 min-w-0 flex-1 text-base font-semibold md:min-h-9"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          event.currentTarget.blur()
        } else if (event.key === "Escape") {
          event.preventDefault()
          event.stopPropagation()
          cancelled.current = true
          setEditing(false)
        }
      }}
    />
  )
}
