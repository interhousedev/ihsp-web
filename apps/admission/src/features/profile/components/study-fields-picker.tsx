"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Pill, Skeleton } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { careerKeys, careerMajorsQuery, careerPlanQuery, pick, putChoice } from "../../career/api"
import { StudyFieldSheet } from "../../chooser/components/study-field-select"
import { useStudyFields } from "../../chooser/hooks"
import { detailsKey, useQuiz, useSaveQuiz } from "../details-api"
import {
  STUDY_FIELDS_KEY,
  chosenStudyFields,
  intendedFieldCount,
  readStudyFields,
  toggleStudyField,
} from "../study-fields"

/**
 * "Intended field of study": the chosen fields as removable chips and the grouped, searchable sheet of the chooser to
 * add more. Every change is saved at once with the career quiz; the count includes the majors added from the career
 * results (the same plan query, so it updates after "Add to profile").
 */
export function StudyFieldsPicker() {
  const t = useT("profilePage")
  const [open, setOpen] = useState(false)
  const quiz = useQuiz("career")
  const save = useSaveQuiz("career")
  const locale = useLocale()
  const client = useQueryClient()
  const plan = useQuery(careerPlanQuery())
  const majors = useQuery(careerMajorsQuery())
  const dropMajor = useMutation({
    mutationFn: (code: string) => {
      const current = plan.data!
      return putChoice(
        current.majors.filter((entry) => entry !== code),
        current.minors,
        current.lock_version,
      )
    },
    onSuccess: (saved) => {
      client.setQueryData(careerKeys.plan(), saved)
      void client.invalidateQueries({ queryKey: detailsKey })
    },
  })
  const { groups, isLoading } = useStudyFields()

  if (quiz.isError) {
    return (
      <Button type="button" variant="outline" onClick={() => void quiz.refetch()}>
        {t("retry")}
      </Button>
    )
  }
  if (!quiz.data || isLoading) return <Skeleton className="h-24 w-full" />

  const stored = quiz.data
  const chosen = readStudyFields(stored.answers)
  const picked = save.isPending && save.variables ? readStudyFields(save.variables.answers) : chosen

  function change(next: string[]) {
    save.mutate({ ...stored, answers: { ...stored.answers, [STUDY_FIELDS_KEY]: next } })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-6 items-center gap-3 text-sm">
        <span className="text-muted-foreground tabular-nums">
          {t("selected", { count: intendedFieldCount(picked, plan.data?.majors ?? []) })}
        </span>
        <span role="status" aria-live="polite">
          {save.isPending ? <Pill>{t("saving")}</Pill> : null}
          {save.isSuccess && !save.isPending ? (
            <Pill tone="success">
              <Icons.check className="size-3" aria-hidden />
              {t("autosaved")}
            </Pill>
          ) : null}
          {save.isError ? <Pill tone="danger">{t("notSaved")}</Pill> : null}
        </span>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label={t("interests.fields")}>
        {(plan.data?.majors ?? []).map((code) => {
          const major = majors.data?.items.find((item) => item.code === code)
          const label = major ? pick(major.name, locale) : code
          return (
            <li key={`major-${code}`}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-11 md:min-h-9"
                disabled={dropMajor.isPending}
                aria-label={t("removeField", { field: label })}
                onClick={() => dropMajor.mutate(code)}
              >
                {label}
                <Icons.close aria-hidden />
              </Button>
            </li>
          )
        })}
        {chosenStudyFields(groups, picked).map((field) => (
          <li key={field.id}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-11 md:min-h-9"
              aria-label={t("removeField", { field: field.label })}
              onClick={() => change(toggleStudyField(picked, field.id))}
            >
              {field.label}
              <Icons.close aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <StudyFieldSheet
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        chosen={picked}
        onToggle={(id) => change(toggleStudyField(picked, id))}
        trigger={
          <Button type="button" variant="outline" className="min-h-11 self-start md:min-h-9">
            <Icons.add aria-hidden />
            {t("addField")}
          </Button>
        }
      />
    </div>
  )
}
