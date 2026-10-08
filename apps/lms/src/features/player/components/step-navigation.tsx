"use client"

import type { OutlineSection } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { neighbours } from "../../shared/utils/outline"
import { LinkButton } from "../../shared/components/link-button"

/** Previous and next step links under the blocks; `href` builds the address for the player or the preview. */
export function StepNavigation({
  outline,
  stepId,
  href,
}: {
  outline: OutlineSection[]
  stepId: string
  href: (stepId: string) => string
}) {
  const t = useT("player")
  const { previous, next, position, total } = neighbours(outline, stepId)
  if (!previous && !next) return null
  return (
    <nav aria-label={t("stepNavigation")} className="flex items-center justify-between gap-2 border-t pt-4">
      {previous ? (
        <LinkButton href={href(previous.step_id)} rel="prev" variant="outline" className="min-h-11 md:min-h-8">
          <Icons.chevronLeft aria-hidden />
          <span className="truncate">{t("previous")}</span>
        </LinkButton>
      ) : (
        <span />
      )}
      <span className="text-muted-foreground text-xs tabular-nums">{t("position", { position, total })}</span>
      {next ? (
        <LinkButton href={href(next.step_id)} rel="next" className="min-h-11 md:min-h-8">
          <span className="truncate">{t("next")}</span>
          <Icons.chevronRight aria-hidden />
        </LinkButton>
      ) : (
        <span />
      )}
    </nav>
  )
}
