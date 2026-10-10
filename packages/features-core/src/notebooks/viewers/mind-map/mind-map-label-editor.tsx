"use client"

import { useT } from "@ihsp/i18n"
import { Button, IconTrash } from "@ihsp/ui"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import type { Bounds } from "./layout"

type MindMapLabelEditorProps = {
  /** The screen box of the pill or block being edited. */
  box: Bounds
  value: string
  onCommit: (value: string) => void
  onCancel: () => void
  /** Blocks can be deleted from their editor. */
  onDelete?: () => void
}

const MIN_WIDTH = 160

/** An input laid over a pill or block: Enter or leaving the field saves, Esc cancels. */
export function MindMapLabelEditor({ box, value, onCommit, onCancel, onDelete }: MindMapLabelEditorProps) {
  const t = useT("notebooks")
  const [text, setText] = useState(value)
  const input = useRef<HTMLInputElement | null>(null)
  const done = useRef(false)

  useEffect(() => {
    input.current?.focus()
    input.current?.select()
  }, [])

  function finish(save: boolean) {
    if (done.current) return
    done.current = true
    if (save) onCommit(text.trim())
    else onCancel()
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    event.stopPropagation()
    if (event.key === "Enter") finish(true)
    else if (event.key === "Escape") finish(false)
  }

  return (
    <div
      data-slot="mind-map-label-editor"
      className="absolute z-30 flex items-center gap-1"
      style={{
        left: box.x,
        top: box.y,
        minWidth: Math.max(box.width, MIN_WIDTH),
      }}
    >
      <input
        ref={input}
        value={text}
        maxLength={200}
        aria-label={t("mindmap.editLabel")}
        className="bg-background ring-ring h-9 min-w-0 flex-1 rounded-lg border px-3 text-sm shadow-md outline-none focus-visible:ring-2"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => finish(true)}
      />
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label={t("mindmap.delete")}
          // The field blurs first; this keeps the blur from saving and removing in the wrong order.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            done.current = true
            onDelete()
          }}
        >
          <IconTrash aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}
