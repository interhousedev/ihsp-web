"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"
import { useSuppPrompts } from "../api"

const PROMPT_KEYS = ["background", "challenge", "belief", "curiosity", "community", "future"] as const

/**
 * Prompts to start from; picking one fills the prompt field. A supplemental essay offers only the chosen college's
 * prompts (nothing when it has none, so the custom prompt field is the way); other kinds offer the Common App ones.
 */
export function PromptCarousel({
  onPick,
  supplementalFor,
}: {
  onPick: (prompt: string) => void
  /** Set for a supplemental essay: the institution of the chosen college, or null while none is chosen. */
  supplementalFor?: string | null
}) {
  const supplemental = supplementalFor !== undefined
  const college = useSuppPrompts(supplemental ? supplementalFor : null)
  const t = useT("essays")
  const [index, setIndex] = useState(0)
  const texts = supplemental
    ? (college.data?.[0]?.prompts ?? []).filter((p) => p.status !== "removed").map((p) => p.prompt)
    : PROMPT_KEYS.map((key) => t(`prompts.${key}`))
  if (texts.length === 0) return null
  const at = index % texts.length
  const step = (d: number) => setIndex((i) => (i + d + texts.length) % texts.length)
  return (
    <div role="group" aria-label={t("prompts.title")} className="bg-muted/40 rounded-card flex items-center gap-2 p-3">
      <Button type="button" size="icon" variant="ghost" aria-label={t("prompts.previous")} onClick={() => step(-1)}>
        <Icons.chevronLeft aria-hidden />
      </Button>
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
        <p aria-live="polite">{texts[at]}</p>
        <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => onPick(texts[at]!)}>
          {t("prompts.use")}
        </Button>
      </div>
      <Button type="button" size="icon" variant="ghost" aria-label={t("prompts.next")} onClick={() => step(1)}>
        <Icons.chevronRight aria-hidden />
      </Button>
    </div>
  )
}
