"use client"

import type { Conflict } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, AlertTitle, Badge } from "@ihsp/ui"

/** Conflicts (teacher, room or audience busy) that block saving. */
export function ConflictList({ conflicts }: { conflicts: Conflict[] }) {
  const t = useT("timetable.editor")
  if (conflicts.length === 0) return null
  return (
    <Alert variant="destructive" role="alert" data-testid="conflicts">
      <AlertTitle>{t("conflictsTitle", { count: conflicts.length })}</AlertTitle>
      <AlertDescription>
        <ul className="mt-1 flex flex-col gap-1">
          {conflicts.map((conflict, index) => (
            <li
              key={`${conflict.kind}-${conflict.with_entry_id ?? conflict.with_lesson_id ?? index}`}
              className="flex flex-wrap items-center gap-2"
            >
              <Badge variant="destructive">{t(`conflictKind.${conflict.kind}`)}</Badge>
              <span>{conflict.description}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
