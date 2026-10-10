"use client"

import type { AssessmentKind, ControlName, ControlPeriods } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { DatePicker, Input, Textarea } from "@ihsp/ui"
import { AudiencePicker } from "../../shared/components/audience-picker"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useControlLabel } from "../../shared/hooks/use-control-label"
import { useGroupOptions, useSubjectOptions } from "../../shared/hooks/use-lookups"
import { CONTROL_NAMES } from "../../shared/utils/controls"
import { formatPeriod } from "../../shared/utils/period"
import { TOUCH } from "../../shared/utils/touch"
import { EXAM_KINDS } from "../utils/exam-filters"
import { withControl, withKind, type ExamForm } from "../utils/exam-form"

function isKind(value: string): value is AssessmentKind {
  return EXAM_KINDS.some((kind) => kind === value)
}

function isControl(value: string): value is ControlName {
  return CONTROL_NAMES.some((name) => name === value)
}

function FixedValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      <p className="text-sm">{value}</p>
    </div>
  )
}

/**
 * The fields of an exam: subject, groups, kind, control week, date, time, room, title and note. A subject or groups
 * that cannot be changed (editing, or a week without a date) are shown as text.
 */
export function ExamFormFields({
  form,
  onChange,
  fixedSubject,
  fixedAudience,
  periods,
}: {
  form: ExamForm
  onChange: (form: ExamForm) => void
  fixedSubject: string | null
  fixedAudience: string | null
  periods: ControlPeriods
}) {
  const t = useT("exams.dialog")
  const tKind = useT("exams.kind")
  const controlLabel = useControlLabel()
  const f = useFormatters()
  const groups = useGroupOptions()
  const subjects = useSubjectOptions()
  const week = form.control ? periods[form.control] : undefined

  return (
    <div className="grid gap-4">
      {fixedSubject !== null ? (
        <FixedValue label={t("subject")} value={fixedSubject} />
      ) : (
        <LabeledField label={t("subject")} htmlFor="exam-subject" required>
          <SelectField
            id="exam-subject"
            value={form.subject_id}
            emptyLabel={t("choose")}
            options={(subjects.data ?? []).map((subject) => ({
              value: subject.id,
              label: subject.name[f.locale] || subject.name.en,
            }))}
            onChange={(subject_id) => onChange({ ...form, subject_id })}
          />
        </LabeledField>
      )}

      {fixedAudience !== null ? (
        <FixedValue label={t("audience")} value={fixedAudience} />
      ) : (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">
            {t("audience")}
            <span aria-hidden> *</span>
          </h3>
          <AudiencePicker
            groups={groups.data ?? []}
            value={form.audience}
            onChange={(audience) => onChange({ ...form, audience })}
          />
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <LabeledField label={t("kind")} htmlFor="exam-kind" required>
          <SelectField
            id="exam-kind"
            value={form.kind}
            options={EXAM_KINDS.map((kind) => ({ value: kind, label: tKind(kind) }))}
            onChange={(kind) => {
              if (isKind(kind)) onChange(withKind(form, kind))
            }}
          />
        </LabeledField>
        <LabeledField label={t("control")} htmlFor="exam-control">
          <SelectField
            id="exam-control"
            value={form.control}
            emptyLabel={t("controlAuto")}
            options={CONTROL_NAMES.map((name) => ({ value: name, label: controlLabel(name) }))}
            onChange={(control) => onChange(withControl(form, isControl(control) ? control : null))}
          />
        </LabeledField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LabeledField
          label={t("date")}
          htmlFor="exam-date"
          description={week ? t("weekHint", { period: formatPeriod(f.date, week) }) : undefined}
          required
        >
          <DatePicker id="exam-date" value={form.date} onChange={(date) => onChange({ ...form, date })} />
        </LabeledField>
        <LabeledField label={t("time")} htmlFor="exam-time" description={t("timeHint")}>
          <Input
            id="exam-time"
            type="time"
            value={form.time}
            className={TOUCH}
            onChange={(event) => onChange({ ...form, time: event.target.value })}
          />
        </LabeledField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LabeledField label={t("room")} htmlFor="exam-room">
          <Input
            id="exam-room"
            value={form.room}
            maxLength={120}
            className={TOUCH}
            onChange={(event) => onChange({ ...form, room: event.target.value })}
          />
        </LabeledField>
        <LabeledField label={t("title")} htmlFor="exam-title">
          <Input
            id="exam-title"
            value={form.title}
            maxLength={200}
            className={TOUCH}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
          />
        </LabeledField>
      </div>

      <LabeledField label={t("note")} htmlFor="exam-note">
        <Textarea
          id="exam-note"
          value={form.note}
          maxLength={2000}
          rows={3}
          onChange={(event) => onChange({ ...form, note: event.target.value })}
        />
      </LabeledField>
    </div>
  )
}
