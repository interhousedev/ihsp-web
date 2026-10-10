"use client"

import { getMeSubjectQuery, getMeSubjectsQuery, type ResourceItem, type SubjectDetail } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { NativeSelect, NativeSelectOption, StateView } from "@ihsp/ui"
import { IconLink } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useId } from "react"
import { SourceKindIcon } from "../lib/source-icons"
import type { PickTabProps } from "./add-types"
import { PickRow } from "./pick-row"
import { refValue } from "./source-rules"

type LessonsTabProps = PickTabProps & {
  subjectId: string
  onSubjectChange: (subjectId: string) => void
}

type LessonGroup = { lessonId: string; date: string; topic: string | null; resources: ResourceItem[] }

/** The subject's materials and attachments grouped by lesson, newest lesson first. */
function groupByLesson(detail: SubjectDetail): LessonGroup[] {
  const groups = new Map<string, LessonGroup>()
  for (const resource of detail.materials) {
    if (resource.hidden || (resource.role !== "material" && resource.role !== "attachment")) continue
    const lesson = detail.lessons.find((item) => item.id === resource.lesson_id)
    const group = groups.get(resource.lesson_id) ?? {
      lessonId: resource.lesson_id,
      date: lesson?.date ?? resource.created_at.slice(0, 10),
      topic: lesson?.topic ?? null,
      resources: [],
    }
    group.resources.push(resource)
    groups.set(resource.lesson_id, group)
  }
  return [...groups.values()].toSorted((a, b) => b.date.localeCompare(a.date))
}

function SubjectResources({ subjectId, sources, selection, full }: PickTabProps & { subjectId: string }) {
  const t = useT("notebooks")
  const format = useFormatters()
  const detail = useQuery(getMeSubjectQuery(subjectId))
  const added = new Set(
    sources.filter((source) => source.kind === "lesson_resource").map((source) => refValue(source, "link_id")),
  )

  if (detail.isPending) return <StateView state="loading" rows={3} />
  if (detail.isError) return <StateView state="error" error={detail.error} onRetry={() => void detail.refetch()} />
  const groups = groupByLesson(detail.data)
  if (groups.length === 0) return <StateView state="empty" emptyText={t("add.lessons.empty")} />
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <section key={group.lessonId} className="flex flex-col gap-1.5">
          <h3 className="text-muted-foreground text-xs font-medium">
            {format.date(group.date)}
            {group.topic ? ` · ${group.topic}` : ""}
          </h3>
          <ul className="flex flex-col gap-1.5">
            {group.resources.map((resource) => {
              const key = `lesson:${resource.link_id}`
              const already = added.has(resource.link_id)
              const checked = already || selection.has(key)
              const role = t(`add.lessons.${resource.role === "attachment" ? "attachment" : "material"}`)
              return (
                <PickRow
                  key={resource.link_id}
                  label={resource.title}
                  meta={resource.kind === "url" ? `${role} · ${t("add.lessons.webPage")}` : role}
                  note={already ? t("add.alreadyAdded") : undefined}
                  icon={
                    resource.kind === "url" ? (
                      <IconLink aria-hidden className="text-muted-foreground size-5 shrink-0" />
                    ) : (
                      <SourceKindIcon kind="file" title={resource.file?.name ?? resource.title} />
                    )
                  }
                  checked={checked}
                  disabled={already || (full && !checked)}
                  onToggle={() =>
                    selection.toggle({
                      key,
                      input: { kind: "lesson_resource", lesson_id: resource.lesson_id, link_id: resource.link_id },
                      label: resource.title,
                    })
                  }
                />
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** Lessons tab: pick a subject, then tick its lesson materials and attachments. */
export function PickLessonsTab({ subjectId, onSubjectChange, ...pick }: LessonsTabProps) {
  const t = useT("notebooks")
  const selectId = useId()
  const subjects = useQuery(getMeSubjectsQuery())

  if (subjects.isPending) return <StateView state="loading" rows={3} />
  if (subjects.isError)
    return <StateView state="error" error={subjects.error} onRetry={() => void subjects.refetch()} />
  if (subjects.data.length === 0) return <StateView state="empty" emptyText={t("add.lessons.noSubjects")} />
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="text-sm font-medium">
          {t("add.lessons.subject")}
        </label>
        <NativeSelect
          id={selectId}
          value={subjectId}
          className="w-full [&_select]:h-11 md:[&_select]:h-8"
          onChange={(event) => onSubjectChange(event.target.value)}
        >
          <NativeSelectOption value="">{t("add.lessons.choose")}</NativeSelectOption>
          {subjects.data.map((card) => (
            <NativeSelectOption key={card.subject.id} value={card.subject.id}>
              {card.subject.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {subjectId ? <SubjectResources subjectId={subjectId} {...pick} /> : null}
    </div>
  )
}
