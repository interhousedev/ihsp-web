"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useAddMemoryNote, useDeleteMemoryNote, useMemoryNotes } from "./mcp-api"

/** What the assistant and connected tools remember about the applicant: list, add, delete. */
export function MemoryNotes() {
  const t = useT("assistantDock.notes")
  const notes = useMemoryNotes()
  const add = useAddMemoryNote()
  const remove = useDeleteMemoryNote()
  const [text, setText] = useState("")

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const content = text.trim()
    if (!content) return
    add.mutate(content, {
      onSuccess: () => setText(""),
      onError: () => toast.error(t("addFailed")),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-2">
        <Textarea
          value={text}
          maxLength={4000}
          rows={2}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          onChange={(event) => setText(event.target.value)}
        />
        <Button type="submit" className="min-h-11 self-end" disabled={!text.trim() || add.isPending}>
          {t("add")}
        </Button>
      </form>
      {notes.data?.items.length ? (
        <ul className="flex flex-col gap-2">
          {notes.data.items.map((note) => (
            <li key={note.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <p className="text-sm break-words whitespace-pre-wrap">{note.content}</p>
                <p className="text-muted-foreground mt-1 text-xs">{t(`source.${note.source}`)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0"
                aria-label={t("delete")}
                disabled={remove.isPending}
                onClick={() => remove.mutate(note.id, { onError: () => toast.error(t("deleteFailed")) })}
              >
                <Icons.trash className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
    </div>
  )
}
