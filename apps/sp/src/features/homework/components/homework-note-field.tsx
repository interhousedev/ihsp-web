"use client"

import { useT } from "@ihsp/i18n"
import { Textarea } from "@ihsp/ui"
import { useEffect, useId, useRef, useState } from "react"
import { useSetHomeworkNote } from "../hooks/use-homework"

export const NOTE_MAX_LENGTH = 1000

/** Pause after the last keystroke before the note is saved. */
export const NOTE_SAVE_DELAY_MS = 800

type SaveStatus = "idle" | "saving" | "saved" | "failed"

/**
 * The student's private note on a lesson's homework (WEB-20), always visible and saved on its own: after a short pause,
 * when the field loses focus and when the page is left. A failed save (for example 429 or 503) keeps the draft; the next
 * pause or blur tries again. An empty note clears the stored one.
 */
export function HomeworkNoteField({ lessonId, note }: { lessonId: string; note: string | null }) {
  const t = useT("homework")
  const save = useSetHomeworkNote()
  const fieldId = useId()
  const [draft, setDraft] = useState(note ?? "")
  const [status, setStatus] = useState<SaveStatus>("idle")
  const draftRef = useRef(draft)
  const savedRef = useRef((note ?? "").trim())
  const busyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRef = useRef(save.mutateAsync)

  useEffect(() => {
    saveRef.current = save.mutateAsync
  }, [save.mutateAsync])

  async function persist(): Promise<void> {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    const text = draftRef.current.trim()
    if (text === savedRef.current || busyRef.current) return
    busyRef.current = true
    setStatus("saving")
    let ok = false
    try {
      await saveRef.current({ lessonId, note: text === "" ? null : text })
      savedRef.current = text
      ok = true
      setStatus("saved")
    } catch {
      setStatus("failed")
    } finally {
      busyRef.current = false
    }
    if (ok && draftRef.current.trim() !== savedRef.current) void persist()
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      // Leaving the page must not raise an unhandled rejection when the save fails (the draft is lost then).
      if (draftRef.current.trim() !== savedRef.current)
        saveRef.current({ lessonId, note: draftRef.current.trim() || null }).catch(() => undefined)
    },
    [lessonId],
  )

  function change(value: string) {
    draftRef.current = value
    setDraft(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => void persist(), NOTE_SAVE_DELAY_MS)
  }

  const statusText =
    status === "saving"
      ? t("noteStatus.saving")
      : status === "saved"
        ? t("noteStatus.saved")
        : status === "failed"
          ? t("noteStatus.failed")
          : null

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-muted-foreground text-xs">
        {t("yourNote")}
      </label>
      <Textarea
        id={fieldId}
        value={draft}
        maxLength={NOTE_MAX_LENGTH}
        rows={3}
        aria-label={t("noteLabel")}
        placeholder={t("notePlaceholder")}
        onChange={(event) => change(event.target.value)}
        onBlur={() => void persist()}
      />
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground tabular-nums">
          {t("noteCounter", { count: draft.length, max: NOTE_MAX_LENGTH })}
        </span>
        <span aria-live="polite" className={status === "failed" ? "text-destructive" : "text-muted-foreground"}>
          {statusText}
        </span>
      </div>
    </div>
  )
}
