"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"

type SlideControlsProps = {
  /** 0-based. */
  index: number
  total: number
  onPrevious: () => void
  onNext: () => void
}

/** Previous, "Slide 2 of 6" and Next. */
export function SlideControls({ index, total, onPrevious, onNext }: SlideControlsProps) {
  const t = useT("notebooks.slides")
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11"
        aria-label={t("previous")}
        disabled={index <= 0}
        onClick={onPrevious}
      >
        <Icons.chevronLeft aria-hidden />
      </Button>
      <p aria-live="polite" className="text-sm font-medium tabular-nums">
        {t("slideOf", { current: index + 1, total })}
      </p>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11"
        aria-label={t("next")}
        disabled={index >= total - 1}
        onClick={onNext}
      >
        <Icons.chevronRight aria-hidden />
      </Button>
    </div>
  )
}
