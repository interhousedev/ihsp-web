"use client"

import type { StudentLesson } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, MarkBadge, ResponsiveDialog } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { fullName } from "../../shared/utils/people"
import { useLesson } from "../../lessons/hooks/use-lesson"
import { ResourceList } from "../../lessons/components/resource-list"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function SheetBody({ data }: { data: StudentLesson }) {
  const t = useT("timetable.sheet")
  const f = useFormatters()
  const { lesson, homework } = data
  const groups = lesson.audience.map((item) =>
    item.subgroup ? `${item.group_name}/${item.subgroup}` : item.group_name,
  )
  const rows: [string, string | null][] = [
    [t("type"), t(`kinds.${lesson.kind}`)],
    [
      t("time"),
      `${f.date(lesson.date, { weekday: "short", day: "numeric", month: "long" })}, ${f.time(lesson.starts_at)}–${f.time(lesson.ends_at)}`,
    ],
    [t("group"), groups.length > 0 ? groups.join(", ") : null],
    [t("teacher"), lesson.teacher ? fullName(lesson.teacher) : null],
    [t("room"), lesson.room?.name ?? null],
    [t("comment"), lesson.topic],
  ]
  const files = data.homework_files ?? []
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {lesson.status === "cancelled" ? <Badge variant="destructive">{t("cancelled")}</Badge> : null}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(([label, value]) =>
          value ? (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ) : null,
        )}
      </dl>
      <Section title={t("homework")}>
        {homework?.text || files.length > 0 ? (
          <div className="flex flex-col gap-2">
            {homework?.text ? <p className="text-sm whitespace-pre-line">{homework.text}</p> : null}
            {homework?.due_date ? (
              <p className="text-muted-foreground text-xs">{t("due", { date: f.date(homework.due_date) })}</p>
            ) : null}
            {files.length > 0 ? <ResourceList items={files} /> : null}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("noHomework")}</p>
        )}
      </Section>
      <Section title={t("load")}>
        {data.materials.length > 0 ? (
          <ResourceList items={data.materials} />
        ) : (
          <p className="text-muted-foreground text-sm">{t("noLoad")}</p>
        )}
      </Section>
      <Section title={t("mark")}>
        {data.my_mark.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noMark")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.my_mark.map((mark, index) => (
              <MarkBadge key={`${mark.type}-${index}`} mark={mark.value} size="lg" />
            ))}
          </div>
        )}
      </Section>
      <Link
        href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
        className="text-primary inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline md:min-h-8"
      >
        {t("full")}
      </Link>
    </div>
  )
}

/**
 * The details of a lesson of the calendar: a bottom sheet on a phone, a dialog on a desktop. Opens on a click on a
 * lesson block; the lesson page stays one link away for attachments and the homework note.
 */
export function LessonSheet({
  lessonId,
  title,
  onClose,
}: {
  lessonId: string | null
  title: string
  onClose: () => void
}) {
  const query = useLesson(lessonId)
  return (
    <ResponsiveDialog
      open={lessonId !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={query.data?.lesson.subject.name ?? title}
      size="md"
    >
      <QueryState query={query} rows={4}>
        {(data) => <SheetBody data={data} />}
      </QueryState>
    </ResponsiveDialog>
  )
}
