"use client"

import type { StudentLesson } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { ConfirmDialog, Icons, MarkBadge, PageContainer, StateView } from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import { useState, type ReactNode } from "react"
import { HomeworkItemCard } from "../../homework/components/homework-item-card"
import { AttendanceBadge } from "../../shared/components/attendance-badge"
import { BackLink } from "../../shared/components/back-link"
import { QueryState } from "../../shared/components/query-state"
import { useDeleteAttachment, useLesson } from "../hooks/use-lesson"
import { AddAttachmentDialog } from "./add-attachment-dialog"
import { LessonHeader } from "./lesson-header"
import { ResourceList } from "./resource-list"

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function LessonContent({ data }: { data: StudentLesson }) {
  const t = useT("lesson")
  const errorMessage = useErrorMessage()
  const { session } = useSession()
  const remove = useDeleteAttachment(data.lesson.id)
  const [deleting, setDeleting] = useState<string | null>(null)
  const deletingItem = data.attachments.find((item) => item.link_id === deleting)

  return (
    <div className="flex flex-col gap-6">
      <LessonHeader lesson={data.lesson} />

      <Section title={t("materials")}>
        {data.materials.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noMaterials")}</p>
        ) : (
          <ResourceList items={data.materials} />
        )}
      </Section>

      <Section title={t("homework")}>
        {data.homework ? (
          <ul>
            <HomeworkItemCard item={data.homework} />
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">{t("noHomework")}</p>
        )}
      </Section>

      <Section
        title={t("attachments")}
        action={data.can_attach ? <AddAttachmentDialog lessonId={data.lesson.id} /> : undefined}
      >
        {data.attachments.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noAttachments")}</p>
        ) : (
          <ResourceList
            items={data.attachments}
            currentUserId={session?.user.id}
            onDelete={(item) => setDeleting(item.link_id)}
          />
        )}
        {remove.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(remove.error)}
          </p>
        ) : null}
      </Section>

      <Section title={t("myResult")}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-sm">
            <Icons.grades className="text-muted-foreground size-4" aria-hidden />
            {data.my_mark.length === 0 ? (
              <span className="text-muted-foreground">{t("noMark")}</span>
            ) : (
              data.my_mark.map((mark, index) => <MarkBadge key={`${mark.type}-${index}`} mark={mark.value} size="lg" />)
            )}
          </span>
          <AttendanceBadge state={data.my_attendance} />
        </div>
      </Section>

      <ConfirmDialog
        open={deletingItem !== undefined}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title={t("deleteTitle")}
        description={deletingItem ? t("deleteText", { title: deletingItem.title }) : undefined}
        confirmLabel={t("deleteConfirm")}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting, { onSettled: () => setDeleting(null) })
        }}
      />
    </div>
  )
}

/** The lesson page (WEB-9–11, UF-WEB-06–08): `?id=`; materials, homework, attachments and "my result". */
export function LessonPage() {
  const t = useT("lesson")
  const [id] = useQueryState("id", parseAsString)
  const query = useLesson(id)

  if (!id) return <StateView state="empty" emptyText={t("notFound")} />

  return (
    <PageContainer title={query.data?.lesson.subject.name ?? t("title")}>
      <BackLink href="/timetable/" label={t("backToTimetable")} />
      <QueryState query={query} rows={5}>
        {(data) => <LessonContent data={data} />}
      </QueryState>
    </PageContainer>
  )
}
