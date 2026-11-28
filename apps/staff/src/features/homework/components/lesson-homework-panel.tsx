"use client"

import type { StaffLesson } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { EmisFiles } from "./emis-files"
import { HomeworkSwitches } from "./homework-switches"

/** On the lesson page: where the homework came from, the EMIS topic and files, and the lesson's two switches. */
export function LessonHomeworkPanel({ lessonId, homework }: { lessonId: string; homework: NonNullable<StaffLesson["homework"]> }) {
  const t = useT("homework")
  return (
    <section aria-labelledby="homework-panel-title" className="flex flex-col gap-3 text-sm">
      <h2 id="homework-panel-title" className="flex flex-wrap items-center gap-2 text-lg font-semibold">
        {t("panelTitle")}
        <Badge variant="outline">{t(`source.${homework.source}`)}</Badge>
      </h2>
      {homework.emis_topic_description ? (
        <p className="text-muted-foreground break-words whitespace-pre-wrap">{homework.emis_topic_description}</p>
      ) : null}
      <EmisFiles files={homework.emis_files} />
      <HomeworkSwitches
        lessonId={lessonId}
        acceptSubmissions={homework.accept_submissions}
        notify={homework.notify}
        notifyEffective={homework.notify_effective}
      />
    </section>
  )
}
