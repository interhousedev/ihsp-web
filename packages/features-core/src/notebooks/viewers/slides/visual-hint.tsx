"use client"

import { useT } from "@ihsp/i18n"
import { IconPhoto } from "@tabler/icons-react"

/** A dashed placeholder where the presenter could add a picture; shown in edit mode only. */
export function VisualHint({ hint }: { hint: string }) {
  const t = useT("notebooks.slides")
  return (
    <div
      data-testid="visual-hint"
      className="text-muted-foreground border-muted-foreground/50 mt-auto flex items-center gap-[1.4cqw] rounded-[1.2cqw] border-[0.3cqw] border-dashed px-[2cqw] py-[1.4cqw] text-[length:2.3cqw]"
    >
      <IconPhoto className="size-[3cqw] shrink-0" aria-hidden />
      <span className="min-w-0 [overflow-wrap:anywhere]">{t("hint", { hint })}</span>
    </div>
  )
}
