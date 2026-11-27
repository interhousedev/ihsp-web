"use client"

import { useT } from "@ihsp/i18n"
import { Button, IconChecklist, IconFileText, IconLoader, IconSparkles, IconVideo, ResponsiveDialog } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { useRunTool } from "../hooks/use-ai-tools"
import { MOCK_LESSON_TOPIC } from "../mock-data"
import { FieldRow, NativeSelect, useNotebookName } from "./form-bits"
import { QuestionList } from "./question-list"
import { NotebookHint } from "./saved-to"

/** AI actions on the lesson page: topic, subject and group come from the lesson; generated questions can go into a test. */
export function LessonAiActions({
  topic = MOCK_LESSON_TOPIC,
  subjectId,
  groupId,
}: {
  topic?: string
  subjectId: string
  /** The lesson's group when it has exactly one; `null` for several groups. */
  groupId: string | null
}) {
  const t = useT("aiTools")
  const [open, setOpen] = useState(false)
  const { result, pending, run } = useRunTool("questions")
  const [count, setCount] = useState(5)
  const [level, setLevel] = useState<"basic" | "intermediate" | "advanced">("intermediate")
  const destination = useNotebookName(subjectId, groupId ?? "")
  const q = `topic=${encodeURIComponent(topic)}&subject=${subjectId}${groupId ? `&group=${groupId}` : ""}`
  return (
    <section className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-card p-4 ring-1">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <IconSparkles className="text-primary size-5" aria-hidden />
          {t("lesson.title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("lesson.desc")}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <Button render={<Link href={`/ai-tools/tool/?id=lessonPlan&${q}`} />} variant="outline">
          <IconSparkles aria-hidden />
          {t("lesson.plan")}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          <IconChecklist aria-hidden />
          {t("lesson.questions")}
        </Button>
        <Button render={<Link href={`/ai-tools/tool/?id=handout&${q}`} />} variant="outline">
          <IconFileText aria-hidden />
          {t("lesson.handout")}
        </Button>
        <Button render={<Link href="/ai-tools/studio/" />} variant="outline">
          <IconVideo aria-hidden />
          {t("lesson.media")}
        </Button>
      </div>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title={`${t("lesson.questionsTitle")}: ${topic}`} size="lg">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <FieldRow label={t("form.count")} htmlFor="la-count">
              <NativeSelect id="la-count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {[5, 10, 15].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </NativeSelect>
            </FieldRow>
            <FieldRow label={t("form.level")} htmlFor="la-level">
              <NativeSelect id="la-level" value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
                {(["basic", "intermediate", "advanced"] as const).map((l) => (
                  <option key={l} value={l}>
                    {t(`form.levels.${l === "intermediate" ? "medium" : l}`)}
                  </option>
                ))}
              </NativeSelect>
            </FieldRow>
            <Button type="button" className="col-span-2 sm:col-span-1" disabled={pending || subjectId === ""} onClick={() => run({ subjectId, groupId, topic, level, count })}>
              {pending ? <IconLoader className="animate-spin" aria-hidden /> : <IconSparkles aria-hidden />}
              {pending ? t("form.generating") : result ? t("form.regenerate") : t("form.generate")}
            </Button>
          </div>
          <NotebookHint destination={destination} />
          {pending ? <p className="text-muted-foreground text-sm">{t("lesson.generating")}</p> : null}
          {result?.kind === "questions" ? (
            <QuestionList questions={result.questions} destination={destination} subjectId={subjectId} topic={topic} canSaveToBank inDialog />
          ) : null}
        </div>
      </ResponsiveDialog>
    </section>
  )
}
