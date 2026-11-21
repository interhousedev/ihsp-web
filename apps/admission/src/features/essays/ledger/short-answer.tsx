"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, cn, Icons } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useSaveShortAnswer, type MatchSlot } from "../flow/steps-api"
import { wordsOf } from "./essay-text"

const SAVE_DELAY_MS = 800

type Saved = "idle" | "saving" | "saved" | "error"

/** The text of a short-answer slot typed in place: live word count against the limit, autosave, copy. Never blocks typing. */
export function ShortAnswerField({ slot }: { slot: MatchSlot }) {
  const t = useT("essayLedger")
  const errorMessage = useErrorMessage()
  const save = useSaveShortAnswer()
  const key = slot.prompt_key
  const [text, setText] = useState(slot.short_answer?.text ?? "")
  const [state, setState] = useState<Saved>("idle")
  const lastSaved = useRef(slot.short_answer?.text ?? "")
  const limit = slot.word_limit
  const words = wordsOf(text)
  const over = limit !== null && words > limit

  useEffect(() => {
    if (!key || over || text === lastSaved.current) return
    const handle = window.setTimeout(() => {
      setState("saving")
      save.mutate(
        { promptKey: key, text },
        {
          onSuccess: () => {
            lastSaved.current = text
            setState("saved")
          },
          onError: (error) => {
            setState("error")
            toast.error(errorMessage(error))
          },
        },
      )
    }, SAVE_DELAY_MS)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, key, over])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t("copied", { count: words }))
    } catch {
      toast.error(t("copyFailed"))
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setState("idle")
        }}
        rows={4}
        aria-label={t("shortAnswerLabel")}
        aria-invalid={over}
        placeholder={t("shortAnswerPlaceholder")}
        className={cn(
          "bg-background focus-visible:ring-ring min-h-24 w-full resize-y rounded-md border p-2 text-sm focus-visible:ring-2 focus-visible:outline-none",
          over && "border-warning",
        )}
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={cn("text-xs tabular-nums", over ? "text-warning font-medium" : "text-muted-foreground")} aria-live="polite">
          {limit ? t("wordsOfLimit", { count: words, limit }) : t("wordsCount", { count: words })}
        </span>
        <span className="text-muted-foreground text-xs" aria-live="polite">
          {state === "saving" ? t("saving") : state === "saved" ? t("saved") : state === "error" ? t("saveFailed") : ""}
        </span>
        <Button type="button" size="sm" variant="outline" disabled={words === 0} onClick={() => void copy()} className="ml-auto min-h-9">
          <Icons.copy aria-hidden />
          {t("copy")}
        </Button>
      </div>
      {over && limit ? <p role="status" className="text-warning text-xs">{t("shortOver", { count: words - limit })}</p> : null}
    </div>
  )
}
