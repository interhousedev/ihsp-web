"use client"

import { getLibrarySubjectsQuery, getLibraryTopicsQuery, type ItemLanguage, type ItemType, type Topic } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Dropdown, Input, Label, Skeleton, Textarea } from "@ihsp/ui"
import { useQueries, useQuery } from "@tanstack/react-query"
import { useId } from "react"
import { stepProblems } from "./material-values"
import type { StepProps } from "./step-props"
import { DESCRIPTION_MAX, MATERIAL_LANGUAGES, MATERIAL_TYPES, TITLE_MAX, YEARS_OF_STUDY } from "./upload-config"

type FlatTopic = { id: string; name: string; depth: number }

function flatTopics(topics: readonly Topic[], depth = 0): FlatTopic[] {
  return topics.flatMap((topic) => [
    { id: topic.id, name: topic.name, depth },
    ...flatTopics(topic.children, depth + 1),
  ])
}

function toggled<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} role="alert" className="text-destructive text-sm">
      {children}
    </p>
  )
}

/**
 * The fields of step 2: title, description, subjects (every active subject), topics of the chosen subjects, year of
 * study, type and language. For a saved item (`readOnlyMeta`) only title, description and topics can change: the
 * server takes no other fields in an update, so subjects, years, type and language are shown as text.
 */
export function DetailsFields({
  values,
  onChange,
  showProblems,
  readOnlyMeta = false,
}: StepProps & { readOnlyMeta?: boolean }) {
  const t = useT("library.upload.details")
  const library = useT("library")
  const ids = { title: useId(), description: useId(), type: useId(), language: useId() }
  const problems = showProblems ? stepProblems("details", values) : []
  const subjects = useQuery(getLibrarySubjectsQuery({ all: true }))
  const topicQueries = useQueries({
    queries: values.subjectIds.map((id) => getLibraryTopicsQuery({ subject_id: id })),
  })
  const nameOf = (id: string) => subjects.data?.find((subject) => subject.id === id)?.name ?? id

  function toggleSubject(id: string) {
    if (!values.subjectIds.includes(id)) {
      onChange({ subjectIds: [...values.subjectIds, id] })
      return
    }
    // Leaving a subject also drops the topics that belonged to it.
    const own = new Set(flatTopics(topicQueries[values.subjectIds.indexOf(id)]?.data ?? []).map((topic) => topic.id))
    onChange({
      subjectIds: values.subjectIds.filter((subject) => subject !== id),
      topicIds: values.topicIds.filter((topic) => !own.has(topic)),
    })
  }

  const checkRow = "min-h-11 cursor-pointer gap-3 rounded-md px-2 font-normal md:min-h-9"
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={ids.title}>{t("titleLabel")}</Label>
        <Input
          id={ids.title}
          value={values.title}
          maxLength={TITLE_MAX}
          required
          autoComplete="off"
          aria-invalid={problems.includes("titleRequired")}
          aria-describedby={problems.includes("titleRequired") ? `${ids.title}-error` : undefined}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        {problems.includes("titleRequired") ? (
          <FieldError id={`${ids.title}-error`}>{t("titleRequired")}</FieldError>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={ids.description}>{t("descriptionLabel")}</Label>
        <Textarea
          id={ids.description}
          value={values.description}
          rows={3}
          maxLength={DESCRIPTION_MAX}
          aria-describedby={`${ids.description}-hint`}
          onChange={(event) => onChange({ description: event.target.value })}
        />
        <p id={`${ids.description}-hint`} className="text-muted-foreground text-xs">
          {t("descriptionHint")}
        </p>
      </div>

      {readOnlyMeta ? (
        <div className="bg-muted/40 flex flex-col gap-2 rounded-xl border p-3 text-sm">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("subjectsLabel")}</dt>
              <dd>{values.subjectIds.map(nameOf).join(", ") || "–"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("yearsLabel")}</dt>
              <dd>{values.years.map((year) => t("year", { year })).join(", ") || "–"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("typeLabel")}</dt>
              <dd>{library(`type.${values.type}`)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("languageLabel")}</dt>
              <dd>{library(`browse.language.${values.language}`)}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground text-xs">{t("fixedAfterSave")}</p>
        </div>
      ) : (
        <>
          <fieldset
            className="flex flex-col gap-1"
            aria-describedby={problems.includes("subjectRequired") ? "subjects-error" : undefined}
          >
            <legend className="mb-1 text-sm font-medium">{t("subjectsLabel")}</legend>
            <p className="text-muted-foreground mb-1 text-xs">{t("subjectsHint")}</p>
            {subjects.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : subjects.isError ? (
              <p role="alert" className="text-destructive text-sm">
                {t("subjectsError")}
              </p>
            ) : (
              <div className="grid gap-1 sm:grid-cols-2">
                {subjects.data.map((subject) => (
                  <Label key={subject.id} className={checkRow}>
                    <input
                      type="checkbox"
                      checked={values.subjectIds.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="size-4"
                    />
                    {subject.name}
                  </Label>
                ))}
              </div>
            )}
            {problems.includes("subjectRequired") ? (
              <FieldError id="subjects-error">{t("subjectRequired")}</FieldError>
            ) : null}
          </fieldset>

          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-medium">{t("yearsLabel")}</legend>
            <div className="flex flex-wrap gap-2">
              {YEARS_OF_STUDY.map((year) => (
                <Label key={year} className={checkRow}>
                  <input
                    type="checkbox"
                    checked={values.years.includes(year)}
                    onChange={() => onChange({ years: toggled(values.years, year) })}
                    className="size-4"
                  />
                  {t("year", { year })}
                </Label>
              ))}
            </div>
            {problems.includes("yearRequired") ? <FieldError id="years-error">{t("yearRequired")}</FieldError> : null}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.type}>{t("typeLabel")}</Label>
              <Dropdown
                id={ids.type}
                className="w-full"
                value={values.type}
                onValueChange={(value) => onChange({ type: value as ItemType })}
                options={MATERIAL_TYPES.map((type) => ({ value: type, label: library(`type.${type}`) }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.language}>{t("languageLabel")}</Label>
              <Dropdown
                id={ids.language}
                className="w-full"
                value={values.language}
                onValueChange={(value) => onChange({ language: value as ItemLanguage })}
                options={MATERIAL_LANGUAGES.map((language) => ({
                  value: language,
                  label: library(`browse.language.${language}`),
                }))}
              />
            </div>
          </div>
        </>
      )}

      {values.subjectIds.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("topicsLabel")}</legend>
          <p className="text-muted-foreground text-xs">{t("topicsHint")}</p>
          {values.subjectIds.map((subjectId, index) => {
            const query = topicQueries[index]
            const list = flatTopics(query?.data ?? [])
            return (
              <div key={subjectId} role="group" aria-label={nameOf(subjectId)} className="flex flex-col gap-1">
                <p className="text-sm font-medium">{nameOf(subjectId)}</p>
                {query?.isPending ? (
                  <Skeleton className="h-10 w-full" />
                ) : query?.isError ? (
                  <p className="text-muted-foreground text-sm">{t("topicsError")}</p>
                ) : list.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("noTopics")}</p>
                ) : (
                  <div className="grid max-h-64 gap-0.5 overflow-y-auto sm:grid-cols-2">
                    {list.map((topic) => (
                      <Label
                        key={topic.id}
                        className={checkRow}
                        style={{ paddingInlineStart: `${0.5 + topic.depth}rem` }}
                      >
                        <input
                          type="checkbox"
                          checked={values.topicIds.includes(topic.id)}
                          onChange={() => onChange({ topicIds: toggled(values.topicIds, topic.id) })}
                          className="size-4"
                        />
                        {topic.name}
                      </Label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </fieldset>
      ) : null}
    </div>
  )
}
