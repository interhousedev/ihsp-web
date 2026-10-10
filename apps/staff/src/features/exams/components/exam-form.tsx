"use client"

import type { AssessmentKind, ControlName } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, DatePicker, LoadingButton, NativeSelect, useAppForm } from "@ihsp/ui"
import { useMemo, useRef } from "react"
import { toast } from "sonner"
import { useCreateExam } from "../hooks/use-create-exam"
import { usePeriodLabel } from "../hooks/use-period-label"
import { useUpdateExam } from "../hooks/use-update-exam"
import { CONTROLS, kindOfControl, inferControl, type ControlPeriods } from "../utils/controls"
import type { EditorState } from "../utils/editor-state"
import {
  formValues,
  isEmptyPatch,
  toCreateBody,
  toPatchBody,
  valuesOfItem,
  type ExamFormValues,
} from "../utils/exam-form"
import { examSchema, NOTE_MAX, TITLE_MAX } from "../utils/exam-schema"
import type { SubjectChoice, TeachingGroup } from "../utils/teaching"
import { ExamField } from "./exam-field"

const KINDS: readonly AssessmentKind[] = ["midterm", "final", "other"]
const SELECT_CLASS = "w-full [&_select]:h-11 md:[&_select]:h-8"
const INPUT_CLASS = "h-11 md:h-8"

/**
 * The exam form: subject, audience (whole group or a subgroup), kind, control week, date, start time, room, title and
 * the note students read on their preparation page. A new exam is created, a stored one is patched with the fields
 * that changed (cleared ones as null), a suggestion is confirmed by saving it.
 */
export function ExamForm({
  group,
  state,
  subjects,
  periods,
  onDone,
}: {
  group: TeachingGroup
  state: EditorState
  subjects: readonly SubjectChoice[]
  periods: ControlPeriods
  onDone: () => void
}) {
  const t = useT("exams.editor")
  const te = useT("exams")
  const tc = useT("common")
  const errorMessage = useErrorMessage()
  const periodLabel = usePeriodLabel()
  const create = useCreateExam()
  const update = useUpdateExam()
  const editing = state.mode === "edit"
  const initial = useMemo(() => (state.mode === "edit" ? valuesOfItem(state.item) : formValues(state.prefill)), [state])
  const controlChosen = useRef(editing || initial.control !== "")
  const schema = useMemo(
    () =>
      examSchema({
        subject: t("validation.subject"),
        date: t("validation.date"),
        time: t("validation.time"),
        title: t("validation.title"),
        note: t("validation.note"),
        control: t("validation.control"),
      }),
    [t],
  )

  const form = useAppForm({
    defaultValues: initial,
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      if (state.mode === "edit") {
        const body = toPatchBody(state.item, initial, value)
        if (isEmptyPatch(body)) {
          onDone()
          return
        }
        await update.mutateAsync({ id: state.item.id, body }).then(
          () => {
            toast.success(state.item.status === "tentative" ? te("confirmed") : te("saved"))
            onDone()
          },
          () => undefined,
        )
        return
      }
      await create.mutateAsync(toCreateBody(group.id, value)).then(
        () => {
          toast.success(te("created"))
          onDone()
        },
        () => undefined,
      )
    },
  })

  function chooseSubject(subjectId: string) {
    form.setFieldValue("subjectId", subjectId)
    const choice = subjects.find((subject) => subject.id === subjectId)
    if (!editing && choice) form.setFieldValue("subgroup", choice.subgroup)
  }

  function chooseKind(kind: AssessmentKind) {
    form.setFieldValue("kind", kind)
    const control = form.getFieldValue("control")
    if (control !== "" && kindOfControl(control) !== kind) form.setFieldValue("control", "")
  }

  function chooseControl(control: ExamFormValues["control"]) {
    controlChosen.current = true
    form.setFieldValue("control", control)
    if (control !== "") form.setFieldValue("kind", kindOfControl(control))
  }

  function chooseDate(date: string) {
    form.setFieldValue("date", date)
    if (controlChosen.current) return
    const inferred = inferControl(date, periods)
    form.setFieldValue("control", inferred ?? "")
    if (inferred) form.setFieldValue("kind", kindOfControl(inferred))
  }

  const error = editing ? update.error : create.error
  const failed = editing ? update.isError : create.isError
  const confirming = state.mode === "edit" && state.item.status === "tentative"
  const audienceEditable = state.mode !== "edit" || state.item.audience.length === 1

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="subjectId">
        {(field) => (
          <ExamField
            label={t("fields.subject")}
            htmlFor="exam-subject"
            errors={field.state.meta.isTouched ? field.state.meta.errors : []}
          >
            <NativeSelect
              id="exam-subject"
              className={SELECT_CLASS}
              value={field.state.value}
              disabled={editing}
              onChange={(event) => chooseSubject(event.target.value)}
            >
              <option value="">{t("chooseSubject")}</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </NativeSelect>
          </ExamField>
        )}
      </form.Field>

      {audienceEditable ? (
        <form.Field name="subgroup">
          {(field) => (
            <ExamField label={t("fields.audience")} htmlFor="exam-audience" errors={[]}>
              <NativeSelect
                id="exam-audience"
                className={SELECT_CLASS}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value as ExamFormValues["subgroup"])}
              >
                <option value="">{`${group.name} · ${t("wholeGroup")}`}</option>
                <option value="1">{`${group.name} · ${t("subgroup", { number: 1 })}`}</option>
                <option value="2">{`${group.name} · ${t("subgroup", { number: 2 })}`}</option>
              </NativeSelect>
            </ExamField>
          )}
        </form.Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="control">
          {(field) => (
            <ExamField
              label={t("fields.control")}
              htmlFor="exam-control"
              errors={field.state.meta.isTouched ? field.state.meta.errors : []}
            >
              <NativeSelect
                id="exam-control"
                className={SELECT_CLASS}
                value={field.state.value}
                onChange={(event) => chooseControl(event.target.value as ExamFormValues["control"])}
              >
                <option value="">{t("noControl")}</option>
                {CONTROLS.map((control: ControlName) => (
                  <option key={control} value={control}>
                    {te(`controls.${control}`)}
                  </option>
                ))}
              </NativeSelect>
            </ExamField>
          )}
        </form.Field>
        <form.Field name="kind">
          {(field) => (
            <ExamField label={t("fields.kind")} htmlFor="exam-kind" errors={[]}>
              <NativeSelect
                id="exam-kind"
                className={SELECT_CLASS}
                value={field.state.value}
                onChange={(event) => chooseKind(event.target.value as AssessmentKind)}
              >
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {te(`kinds.${kind}`)}
                  </option>
                ))}
              </NativeSelect>
            </ExamField>
          )}
        </form.Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Subscribe selector={(state) => state.values.control}>
          {(control) => (
            <form.Field name="date">
              {(field) => (
                <ExamField
                  label={t("fields.date")}
                  htmlFor="exam-date"
                  hint={
                    control !== "" && periods[control]
                      ? t("controlHint", { range: periodLabel(periods[control]) })
                      : undefined
                  }
                  errors={field.state.meta.isTouched ? field.state.meta.errors : []}
                >
                  <DatePicker
                    id="exam-date"
                    value={field.state.value === "" ? null : field.state.value}
                    onChange={(date) => chooseDate(date ?? "")}
                  />
                </ExamField>
              )}
            </form.Field>
          )}
        </form.Subscribe>
        <form.AppField name="time">
          {(field) => (
            <field.TextField label={t("fields.time")} type="time" description={t("timeHint")} className={INPUT_CLASS} />
          )}
        </form.AppField>
      </div>

      <form.AppField name="room">
        {(field) => (
          <field.TextField
            label={t("fields.room")}
            placeholder={t("roomPlaceholder")}
            autoComplete="off"
            className={INPUT_CLASS}
          />
        )}
      </form.AppField>
      <form.AppField name="title">
        {(field) => (
          <field.TextField
            label={t("fields.title")}
            placeholder={t("titlePlaceholder")}
            maxLength={TITLE_MAX}
            autoComplete="off"
            className={INPUT_CLASS}
          />
        )}
      </form.AppField>
      <form.AppField name="note">
        {(field) => (
          <field.TextareaField label={t("fields.note")} rows={3} maxLength={NOTE_MAX} />
        )}
      </form.AppField>

      {failed ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(error)}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onDone}>
          {tc("cancel")}
        </Button>
        <LoadingButton
          type="submit"
          className="min-h-11 md:min-h-8"
          loading={create.isPending || update.isPending}
          loadingLabel={t("saving")}
        >
          {confirming ? t("saveConfirm") : t("save")}
        </LoadingButton>
      </div>
    </form>
  )
}
