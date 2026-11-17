"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"

const PROMPT_KEYS = ["background", "challenge", "belief", "curiosity", "community", "future"] as const

/** Common application prompts to start from; picking one fills the prompt field. */
export function PromptCarousel({ onPick }: { onPick: (prompt: string) => void }) {
  const t = useT("essays")
  const [index, setIndex] = useState(0)
  const key = PROMPT_KEYS[index]!
  const step = (d: number) => setIndex((i) => (i + d + PROMPT_KEYS.length) % PROMPT_KEYS.length)
  return (
    <div role="group" aria-label={t("prompts.title")} className="bg-muted/40 rounded-card flex items-center gap-2 p-3">
      <Button type="button" size="icon" variant="ghost" aria-label={t("prompts.previous")} onClick={() => step(-1)}>
        <Icons.chevronLeft aria-hidden />
      </Button>
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
        <p aria-live="polite">{t(`prompts.${key}`)}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="self-start"
          onClick={() => onPick(t(`prompts.${key}`))}
        >
          {t("prompts.use")}
        </Button>
      </div>
      <Button type="button" size="icon" variant="ghost" aria-label={t("prompts.next")} onClick={() => step(1)}>
        <Icons.chevronRight aria-hidden />
      </Button>
    </div>
  )
}
