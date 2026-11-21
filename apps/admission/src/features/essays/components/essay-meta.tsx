"use client"

import { useT } from "@ihsp/i18n"
import { Icons, Input, Label, Textarea } from "@ihsp/ui"
import { useState } from "react"

/**
 * The prompt as one quiet line above the text (with the word count against the limit); it opens into the editable
 * prompt and the word limit. Prompts that come from the prompt map are edited in the Вузы tab, so only the limit opens.
 */
export function EssayMeta({
  prompt,
  summary,
  wordLimit,
  words,
  onPrompt,
  onWordLimit,
  showPrompt = true,
}: {
  prompt: string
  /** The line shown when closed; defaults to the prompt text (attached prompts pass their own). */
  summary?: string
  /** False when the essay answers attached prompts. */
  showPrompt?: boolean
  wordLimit: number | null
  words: number
  onPrompt: (value: string) => void
  onWordLimit: (value: number | null) => void
}) {
  const t = useT("essays")
  const [open, setOpen] = useState(false)
  const over = wordLimit !== null && words > wordLimit
  const line = (summary ?? prompt).trim() || t("promptEmpty")
  return (
    <div className="flex min-w-0 flex-col gap-2" data-testid="essay-meta">
      <div className="flex min-w-0 items-center gap-3 text-sm">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="essay-meta-body"
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <Icons.chevronRight aria-hidden className={open ? "size-4 shrink-0 rotate-90" : "size-4 shrink-0"} />
          <span className="text-foreground truncate">{line}</span>
          <span className="sr-only">{open ? t("promptHide") : t("promptShow")}</span>
        </button>
        <span
          data-testid="essay-meta-count"
          className={
            over
              ? "text-warning hidden shrink-0 font-medium sm:inline"
              : "text-muted-foreground hidden shrink-0 sm:inline"
          }
          aria-live="polite"
        >
          {wordLimit ? t("metaWordsOf", { count: words, limit: wordLimit }) : t("words", { count: words })}
        </span>
      </div>
      {open ? (
        <div id="essay-meta-body" className="bg-card border-hairline rounded-card flex flex-col gap-3 border p-3">
          {showPrompt ? (
            <div className="flex flex-col gap-1">
              <Label htmlFor="essay-prompt-edit" className="text-muted-foreground text-xs font-normal">
                {t("promptLabel")}
              </Label>
              <Textarea id="essay-prompt-edit" rows={3} value={prompt} onChange={(e) => onPrompt(e.target.value)} />
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <Label htmlFor="essay-limit-edit" className="text-muted-foreground text-xs font-normal">
              {t("wordLimit")}
            </Label>
            <Input
              id="essay-limit-edit"
              type="number"
              min={1}
              inputMode="numeric"
              className="h-8 w-28"
              value={wordLimit ?? ""}
              onChange={(e) => onWordLimit(e.target.value === "" ? null : Math.floor(Number(e.target.value)))}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
