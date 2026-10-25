"use client"

import { useT } from "@ihsp/i18n"

/** The digits typed so far as dots; a screen reader hears how many. */
export function PinDots({ length, filled }: { length: number; filled: number }) {
  const t = useT("pwa")
  return (
    <div role="img" aria-label={t("lock.digits", { filled, total: length })} className="flex items-center gap-3">
      {Array.from({ length }, (_, index) => (
        <span
          // The dots never reorder, so the position is a stable key.
          key={index}
          aria-hidden
          className={`size-3.5 rounded-full border-2 transition-colors ${index < filled ? "bg-foreground border-foreground" : "border-muted-foreground/60"}`}
        />
      ))}
    </div>
  )
}
