"use client"

import { useT } from "@ihsp/i18n"
import { IconSparkles } from "@ihsp/ui"

/** "Thinking…" line shown while a turn runs; it pulses, and stands still with `prefers-reduced-motion`. */
export function ThinkingIndicator() {
  const t = useT("assistant.message")
  return (
    <p role="status" className="text-muted-foreground flex items-center gap-2 text-sm">
      <IconSparkles className="size-4 shrink-0 animate-pulse motion-reduce:animate-none" aria-hidden />
      <span className="animate-pulse motion-reduce:animate-none">{t("thinking")}</span>
    </p>
  )
}
