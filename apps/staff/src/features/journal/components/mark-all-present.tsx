"use client"

import type { Journal } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, ScrollList } from "@ihsp/ui"

/**
 * One button per lesson that can still be edited: opens the lesson's attendance with everyone marked present as a
 * draft. Nothing is submitted by the button; the teacher changes the exceptions and saves in the pop-up.
 */
export function MarkAllPresentBar({
  lessons,
  onOpen,
}: {
  lessons: Journal["lessons"]
  onOpen: (lessonId: string) => void
}) {
  const t = useT("journal")
  const f = useFormatters()
  const editable = lessons.filter((lesson) => lesson.editable)
  if (editable.length === 0) return null
  return (
    <ScrollList label={t("markAll")} maxHeight="10rem">
      <div className="flex flex-wrap gap-2 p-0.5">
        {editable.map((lesson) => (
          <Button key={lesson.id} variant="outline" className="min-h-11 md:min-h-8" onClick={() => onOpen(lesson.id)}>
            <Icons.checks aria-hidden />
            {t("markAll")}
            <span className="text-muted-foreground tabular-nums">
              {f.date(lesson.date, { day: "numeric", month: "short" })}
            </span>
          </Button>
        ))}
      </div>
    </ScrollList>
  )
}
