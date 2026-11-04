"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"

/** Previous and next week, with the Monday to Friday range between the buttons. 44 px targets on phones. */
export function WeekPager({
  from,
  to,
  onPrevious,
  onNext,
  labels,
}: {
  from: string
  to: string
  onPrevious: () => void
  onNext: () => void
  /** Button names; a page with two pagers names each one apart (the calendar keeps "Next week"). */
  labels?: { previous: string; next: string }
}) {
  const t = useT("weekPager")
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 md:size-8"
        aria-label={labels?.previous ?? t("previous")}
        onClick={onPrevious}
      >
        <Icons.chevronLeft aria-hidden />
      </Button>
      <p className="text-sm font-medium" aria-live="polite">
        {formatDate(from)} – {formatDate(to)}
      </p>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 md:size-8"
        aria-label={labels?.next ?? t("next")}
        onClick={onNext}
      >
        <Icons.chevronRight aria-hidden />
      </Button>
    </div>
  )
}
