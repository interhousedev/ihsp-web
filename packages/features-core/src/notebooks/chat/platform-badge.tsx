"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"

/** Small "Из базы IHSP" pill for a source that came from the platform's own database, not the web. Nothing for web. */
export function PlatformBadge({ origin, className }: { origin?: string | undefined; className?: string }) {
  const t = useT("assistant.web")
  if (origin !== "db") return null
  return (
    <span
      data-platform-source
      className={cn(
        "bg-primary/10 text-primary inline-flex h-4 shrink-0 items-center rounded-full px-1.5 text-[10px] leading-none font-medium",
        className,
      )}
    >
      {t("fromDb")}
    </span>
  )
}
