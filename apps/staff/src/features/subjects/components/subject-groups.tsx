"use client"

import type { LessonItem, StaffSubject } from "@ihsp/api"
import { useOpenSubjectNotebook, useSubjectNotebookSlots } from "@ihsp/features-core"
import { formatDate, useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useTeachingTimetable } from "../../exams/hooks/use-teaching-timetable"
import { notebookHref } from "../../notebooks/utils/hrefs"
import { LinkButton } from "../../shared/components/link-button"
import { lessonHref } from "../../shared/utils/lesson-time"
import { byGroup, groupLessons } from "../utils/groups"
import { subjectGroupHref } from "../utils/hrefs"

/** The link to the teacher's notebook of the subject for the group (created on first open). */
export function GroupNotebook({ subject, groupId }: { subject: StaffSubject; groupId: string }) {
  const t = useT("subjects.groups")
  const router = useRouter()
  const slots = useSubjectNotebookSlots()
  const open = useOpenSubjectNotebook()
  const slot = (slots.data ?? []).find((item) => item.subject_id === subject.subject_id && item.group_id === groupId)
  if (slot?.notebook_id) {
    return (
      <LinkButton href={notebookHref(slot.notebook_id)} variant="default">
        {t("openNotebook")}
      </LinkButton>
    )
  }
  return (
    <Button
      type="button"
      className="min-h-11 md:min-h-8"
      disabled={!slot || open.isPending}
      onClick={() => slot && open.mutate(slot, { onSuccess: (notebook) => router.push(notebookHref(notebook.id)) })}
    >
      {open.isPending ? t("creatingNotebook") : t("createNotebook")}
    </Button>
  )
}

function LessonList({ lessons }: { lessons: LessonItem[] }) {
  const t = useT("subjects.groups")
  if (lessons.length === 0) return <p className="text-muted-foreground text-sm">{t("noLessons")}</p>
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <a href={lessonHref(lesson.id)} className="hover:underline">
            {formatDate(lesson.date)} · {t("period", { number: lesson.period })}
            {lesson.topic ? ` · ${lesson.topic}` : ""}
          </a>
        </li>
      ))}
    </ul>
  )
}

/** Per group the teacher teaches the subject to (with the halves of a divided subject): its notebook and next lessons. */
export function SubjectGroups({ subject }: { subject: StaffSubject }) {
  const t = useT("subjects.groups")
  const timetable = useTeachingTimetable()
  return (
    <section aria-labelledby="subject-groups" className="flex flex-col gap-3">
      <h2 id="subject-groups" className="text-lg font-semibold">
        {t("heading")}
      </h2>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {byGroup(subject.groups).map((group) => (
          <li key={group.group_id} className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-4 ring-1">
            <div className="flex flex-col gap-0.5">
              <h3 className="font-medium">{group.group_name}</h3>
              {group.halves.length > 0 ? (
                <p className="text-muted-foreground text-sm">{t("divided", { subgroups: group.halves.join(", ") })}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.halves.length > 0 ? (
                group.halves.map((half) => (
                  <LinkButton
                    key={half}
                    href={subjectGroupHref(subject.subject_id, group.group_id, half)}
                    variant="outline"
                  >
                    {t("openSubgroup", { number: half })}
                  </LinkButton>
                ))
              ) : (
                <LinkButton href={subjectGroupHref(subject.subject_id, group.group_id)} variant="outline">
                  {t("openGroup")}
                </LinkButton>
              )}
            </div>
            <GroupNotebook subject={subject} groupId={group.group_id} />
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium">{t("lessons")}</h4>
              <LessonList lessons={groupLessons(timetable.data ?? [], subject.subject_id, group.group_id)} />
              <LinkButton href="/timetable/" variant="ghost" className="self-start">
                {t("timetable")}
              </LinkButton>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
