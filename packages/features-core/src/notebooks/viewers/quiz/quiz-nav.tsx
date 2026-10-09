"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"

type QuizNavProps = {
  canPrevious: boolean
  answered: boolean
  isLast: boolean
  onPrevious: () => void
  onSkip: () => void
  onNext: () => void
}

/** Back, Skip (while unanswered) and Next; on the last question Next reads "See results". */
export function QuizNav({ canPrevious, answered, isLast, onPrevious, onSkip, onNext }: QuizNavProps) {
  const t = useT("notebooks")
  return (
    <div className="flex items-center justify-between gap-2 border-t pt-4">
      <Button type="button" variant="ghost" className="min-h-11 gap-1" disabled={!canPrevious} onClick={onPrevious}>
        <IconChevronLeft aria-hidden className="rtl:rotate-180" />
        {t("quiz.back")}
      </Button>
      <div className="flex items-center gap-2">
        {answered ? null : (
          <Button type="button" variant="ghost" className="min-h-11" onClick={onSkip}>
            {t("quiz.skip")}
          </Button>
        )}
        <Button type="button" className="min-h-11 gap-1" onClick={onNext}>
          {isLast ? t("viewers.quiz.finish") : t("quiz.next")}
          {isLast ? null : <IconChevronRight aria-hidden className="rtl:rotate-180" />}
        </Button>
      </div>
    </div>
  )
}
