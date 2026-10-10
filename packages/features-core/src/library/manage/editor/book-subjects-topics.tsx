"use client"

import { getLibrarySubjectsQuery, getLibraryTopicsQuery, type Topic } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Input, NativeSelect, NativeSelectOption, Skeleton } from "@ihsp/ui"
import { IconPlus, IconTrash } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { SUBJECT_ROLES, type BookForm } from "./book-form"
import type { FormIssues } from "./book-form-checks"

type FlatTopic = { id: string; subjectId: string; label: string }

function flatten(topics: readonly Topic[], depth = 0): FlatTopic[] {
  return topics.flatMap((topic) => [
    { id: topic.id, subjectId: topic.subject_id, label: `${"– ".repeat(depth)}${topic.name}` },
    ...flatten(topic.children, depth + 1),
  ])
}

/** Subjects with their role for the book, and topics (of those subjects) with optional page ranges. */
export function BookSubjectsTopics({
  form,
  issues,
  disabled,
  onChange,
}: {
  form: BookForm
  issues: FormIssues
  disabled: boolean
  onChange: (patch: Partial<BookForm>) => void
}) {
  const t = useT("library.manage.editor")
  const roles = useT("library.manage.editor.subjectRole")
  const error = useT("library.manage.editor.error")
  const subjects = useQuery(getLibrarySubjectsQuery({ all: true }))
  const topics = useQuery(getLibraryTopicsQuery())
  const flat = useMemo(() => flatten(topics.data ?? []), [topics.data])
  const chosen = new Set(form.subjects.map((row) => row.subject_id))
  const unused = (subjects.data ?? []).filter((subject) => !chosen.has(subject.id))
  const offered = flat.filter(
    (topic) => chosen.has(topic.subjectId) || form.topics.some((row) => row.topic_id === topic.id),
  )

  if (subjects.isPending || topics.isPending) return <Skeleton className="h-32 w-full rounded-xl" />

  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-6">
      <legend className="sr-only">{t("subjectsAndTopics")}</legend>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("subjects")}</h3>
        <p className="text-muted-foreground text-xs">{t("subjectsHint")}</p>
        {form.subjects.length === 0 ? <p className="text-muted-foreground text-sm">{t("noSubjects")}</p> : null}
        <ul className="flex flex-col gap-2">
          {form.subjects.map((row, index) => (
            <li key={row.subject_id} className="flex flex-wrap items-center gap-2">
              <NativeSelect
                aria-label={t("subjectName")}
                value={row.subject_id}
                onChange={(event) =>
                  onChange({
                    subjects: form.subjects.map((item, at) =>
                      at === index ? { ...item, subject_id: event.target.value } : item,
                    ),
                  })
                }
              >
                {(subjects.data ?? [])
                  .filter((subject) => subject.id === row.subject_id || !chosen.has(subject.id))
                  .map((subject) => (
                    <NativeSelectOption key={subject.id} value={subject.id}>
                      {subject.name}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
              <NativeSelect
                aria-label={t("subjectRoleLabel", {
                  name: subjects.data?.find((subject) => subject.id === row.subject_id)?.name ?? "",
                })}
                value={row.role}
                onChange={(event) =>
                  onChange({
                    subjects: form.subjects.map((item, at) =>
                      at === index ? { ...item, role: event.target.value as typeof row.role } : item,
                    ),
                  })
                }
              >
                {SUBJECT_ROLES.map((role) => (
                  <NativeSelectOption key={role} value={role}>
                    {roles(role)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 md:size-8"
                aria-label={t("removeSubject")}
                onClick={() => onChange({ subjects: form.subjects.filter((_, at) => at !== index) })}
              >
                <IconTrash aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <div>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={unused.length === 0}
            onClick={() => {
              const next = unused[0]
              if (next) onChange({ subjects: [...form.subjects, { subject_id: next.id, role: "core" }] })
            }}
          >
            <IconPlus aria-hidden />
            {t("addSubject")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("topics")}</h3>
        <p className="text-muted-foreground text-xs">{t("topicsHint")}</p>
        <ul className="flex flex-col gap-2">
          {form.topics.map((row, index) => (
            <li key={`${row.topic_id}-${index}`} className="flex flex-wrap items-center gap-2">
              <NativeSelect
                aria-label={t("topicName")}
                value={row.topic_id}
                onChange={(event) =>
                  onChange({
                    topics: form.topics.map((item, at) =>
                      at === index ? { ...item, topic_id: event.target.value } : item,
                    ),
                  })
                }
              >
                {offered.map((topic) => (
                  <NativeSelectOption key={topic.id} value={topic.id}>
                    {topic.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Input
                aria-label={t("pageFrom")}
                inputMode="numeric"
                placeholder={t("pageFrom")}
                value={row.page_from}
                className="min-h-11 w-24 md:min-h-8"
                onChange={(event) =>
                  onChange({
                    topics: form.topics.map((item, at) =>
                      at === index ? { ...item, page_from: event.target.value } : item,
                    ),
                  })
                }
              />
              <Input
                aria-label={t("pageTo")}
                inputMode="numeric"
                placeholder={t("pageTo")}
                value={row.page_to}
                className="min-h-11 w-24 md:min-h-8"
                onChange={(event) =>
                  onChange({
                    topics: form.topics.map((item, at) =>
                      at === index ? { ...item, page_to: event.target.value } : item,
                    ),
                  })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 md:size-8"
                aria-label={t("removeTopic")}
                onClick={() => onChange({ topics: form.topics.filter((_, at) => at !== index) })}
              >
                <IconTrash aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        {issues.topics ? (
          <p role="alert" className="text-destructive text-sm">
            {error(issues.topics.key)}
          </p>
        ) : null}
        <div>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={offered.length === 0}
            onClick={() => {
              const next = offered.find((topic) => !form.topics.some((row) => row.topic_id === topic.id))
              if (next) onChange({ topics: [...form.topics, { topic_id: next.id, page_from: "", page_to: "" }] })
            }}
          >
            <IconPlus aria-hidden />
            {t("addTopic")}
          </Button>
          {offered.length === 0 ? (
            <span className="text-muted-foreground ms-3 text-xs">{t("topicsNeedSubject")}</span>
          ) : null}
        </div>
      </div>
    </fieldset>
  )
}
