"use client"

import type { HomeworkItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { useSetHomeworkNote } from "../hooks/use-homework"

export const NOTE_MAX_LENGTH = 1000

/** Private note under a homework item (up to 1000 characters). Saving an empty text removes the note. */
export function HomeworkNoteEditor({ item, onClose }: { item: HomeworkItem; onClose: () => void }) {
  const t = useT("homework")
  const errorMessage = useErrorMessage()
  const save = useSetHomeworkNote()
  const [text, setText] = useState(item.note ?? "")

  function submit() {
    const note = text.trim() === "" ? null : text.trim()
    save.mutate({ lessonId: item.lesson_id, note }, { onSuccess: onClose })
  }

  return (
    <form
      className="mt-2 flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <Textarea
        value={text}
        maxLength={NOTE_MAX_LENGTH}
        rows={3}
        aria-label={t("noteLabel")}
        placeholder={t("notePlaceholder")}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground me-auto text-xs tabular-nums">
          {t("noteCounter", { count: text.length, max: NOTE_MAX_LENGTH })}
        </span>
        <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={onClose}>
          {t("noteCancel")}
        </Button>
        <Button type="submit" className="min-h-11 md:min-h-8" disabled={save.isPending}>
          {t("noteSave")}
        </Button>
      </div>
      {save.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(save.error)}
        </p>
      ) : null}
    </form>
  )
}
