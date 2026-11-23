"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"

type TourPillProps = {
  /** 1-based step the tour stopped at. */
  current: number
  total: number
  onResume: () => void
  onEnd: () => void
}

/** The floating "Back to tour" bar shown while the tour is set aside, so the user can explore and return. */
export function TourPill({ current, total, onResume, onEnd }: TourPillProps) {
  const t = useT("onboarding.pill")
  const step = useT("onboarding")
  return (
    <section
      aria-label={t("label")}
      className="bg-popover text-popover-foreground fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-2 rounded-full border py-1.5 ps-4 pe-1.5 shadow-lg md:bottom-6 [body:has([data-exam-module])_&]:hidden"
    >
      <Icons.assistant aria-hidden className="text-primary size-4 shrink-0" />
      <span className="text-sm whitespace-nowrap">{step("step", { current, total })}</span>
      <Button type="button" size="sm" className="min-h-9 rounded-full" onClick={onResume}>
        {t("resume")}
      </Button>
      <Button type="button" size="sm" variant="ghost" className="min-h-9 rounded-full" onClick={onEnd}>
        {t("end")}
      </Button>
    </section>
  )
}
