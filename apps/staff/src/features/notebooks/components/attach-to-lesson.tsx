"use client"

import { getArtifactQuery, getStaffTimetableQuery, type LessonItem } from "@ihsp/api"
import { addDays, todayIso, useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { useAudienceLabel } from "../../shared/hooks/use-audience-label"
import { lessonHref } from "../../shared/utils/lesson-time"
import { useAttachArtifact } from "../hooks/use-attach"

/** Output kinds that have a file format (report as .docx, table as .xlsx, slides as .pptx). */
const ATTACHABLE = new Set(["report", "data_table", "slides"])
const DAYS_BACK = 14
const DAYS_AHEAD = 21

/**
 * "Attach to lesson" for the open Studio output: pick one of the teacher's lessons (the last two weeks and the next
 * three) and the output becomes a file material of that lesson.
 */
export function AttachToLesson({ notebookId, artifactId }: { notebookId: string; artifactId: string }) {
  const t = useT("staffNotebooks")
  const [open, setOpen] = useState(false)
  const artifact = useQuery(getArtifactQuery(notebookId, artifactId))
  if (!artifact.data || artifact.data.status !== "ready" || !ATTACHABLE.has(artifact.data.kind)) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            className="fixed end-4 bottom-20 z-40 min-h-11 shadow-lg md:bottom-4"
            data-testid="attach-to-lesson"
          />
        }
      >
        <Icons.paperclip aria-hidden />
        {t("attach")}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("attachTitle")}</DialogTitle>
        </DialogHeader>
        {open ? <LessonChoices notebookId={notebookId} artifactId={artifactId} onDone={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function LessonChoices({
  notebookId,
  artifactId,
  onDone,
}: {
  notebookId: string
  artifactId: string
  onDone: () => void
}) {
  const t = useT("staffNotebooks")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const audienceLabel = useAudienceLabel()
  const today = todayIso()
  const timetable = useQuery(
    getStaffTimetableQuery({ from: addDays(today, -DAYS_BACK), to: addDays(today, DAYS_AHEAD) }),
  )
  const attach = useAttachArtifact(notebookId, artifactId)
  const [attached, setAttached] = useState<string | null>(null)
  const lessons = (timetable.data ?? []).filter((lesson) => lesson.status !== "cancelled")

  function choose(lesson: LessonItem) {
    attach.mutate(
      { lessonId: lesson.id, role: "material" },
      {
        onSuccess: () => {
          setAttached(lesson.id)
          toast.success(t("attached"))
        },
      },
    )
  }

  if (timetable.isPending) return <p className="text-muted-foreground text-sm">{t("loading")}</p>
  if (lessons.length === 0) return <p className="text-muted-foreground text-sm">{t("noLessons")}</p>

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5" aria-label={t("attachTitle")}>
        {lessons
          .slice()
          .sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at))
          .map((lesson) => (
            <li key={lesson.id}>
              <button
                type="button"
                disabled={attach.isPending}
                onClick={() => choose(lesson)}
                className="hover:bg-accent focus-visible:ring-ring flex min-h-11 w-full flex-col items-start rounded-lg border p-2 text-start text-sm outline-none focus-visible:ring-2 disabled:opacity-50"
              >
                <span className="font-medium">
                  {f.date(lesson.date, { weekday: "short", day: "numeric", month: "short" })} · {lesson.subject.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {audienceLabel(lesson.audience)} · {t("period", { number: lesson.period })}
                </span>
              </button>
            </li>
          ))}
      </ul>
      {attach.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(attach.error)}
        </p>
      ) : null}
      {attached ? (
        <div className="flex items-center justify-between gap-2">
          <Link href={lessonHref(attached, "materials")} className="text-sm underline">
            {t("openLesson")}
          </Link>
          <Button variant="outline" className="min-h-11 md:min-h-8" onClick={onDone}>
            {t("done")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
