"use client"

import { getMeExcuseTemplatesQuery, getStaffGroupQuery, type ExcuseExclusionBody, type GroupItem } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { FileUploadButton } from "@ihsp/features-core"
import { todayIso, useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, DatePicker, Dropdown, LoadingButton, Textarea } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useId, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { fullName } from "../../shared/utils/people"
import { useCreateExclusion } from "../hooks/use-excuse-actions"
import { templateTitle } from "../utils/excuse-labels"
import { ExcuseLessonPicker } from "./excuse-lesson-picker"

type Scope = "days" | "lessons"

/** An exclusion: the curator excuses a student of the group from a date, optionally until a date or for lessons only. */
export function ExcuseExclusionForm({ group, onDone }: { group: GroupItem; onDone: () => void }) {
  const t = useT("excuses.form")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const ids = { student: useId(), template: useId(), from: useId(), to: useId(), reason: useId() }
  const groupQuery = useQuery(getStaffGroupQuery(group.id))
  const templatesQuery = useQuery(getMeExcuseTemplatesQuery())
  const create = useCreateExclusion()

  const [studentId, setStudentId] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [startsOn, setStartsOn] = useState<string | null>(todayIso())
  const [endsOn, setEndsOn] = useState<string | null>(null)
  const [scope, setScope] = useState<Scope>("days")
  const [lessonIds, setLessonIds] = useState<string[]>([])
  const [reason, setReason] = useState("")
  const [files, setFiles] = useState<{ id: string; name: string }[]>([])
  const [submitted, setSubmitted] = useState(false)

  const template = templatesQuery.data?.items.find((item) => item.id === templateId)
  const missingDocument = Boolean(template?.requires_document) && files.length === 0
  const invalid = !studentId || !templateId || !startsOn || (endsOn !== null && startsOn !== null && endsOn < startsOn)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (invalid || missingDocument || !startsOn) return
    const body: ExcuseExclusionBody = {
      student_id: studentId,
      template_id: templateId,
      starts_on: startsOn,
      ...(endsOn ? { ends_on: endsOn } : {}),
      ...(scope === "lessons" && lessonIds.length > 0 ? { lesson_ids: lessonIds } : {}),
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    }
    create.mutate(
      { body, fileIds: files.map((file) => file.id) },
      {
        onSuccess: () => {
          toast.success(t("created"))
          onDone()
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.student} className="text-sm font-medium">
          {t("student")}
        </label>
        <QueryState query={groupQuery} rows={1}>
          {(detail) => (
            <Dropdown
              id={ids.student}
              searchable
              searchPlaceholder={t("studentPlaceholder")}
              searchLabel={t("student")}
              value={studentId}
              placeholder={t("studentPlaceholder")}
              onValueChange={setStudentId}
              options={detail.students
                .filter((student) => student.status === "active")
                .map((student) => ({ value: student.user_id, label: fullName(student) }))}
            />
          )}
        </QueryState>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.template} className="text-sm font-medium">
          {t("template")}
        </label>
        <QueryState query={templatesQuery} rows={1}>
          {(list) => (
            <Dropdown
              id={ids.template}
              value={templateId}
              placeholder={t("templatePlaceholder")}
              onValueChange={setTemplateId}
              options={list.items.map((item) => ({ value: item.id, label: templateTitle(item, locale) }))}
            />
          )}
        </QueryState>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.from} className="text-sm font-medium">
            {t("startsOn")}
          </label>
          <DatePicker id={ids.from} value={startsOn} onChange={setStartsOn} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.to} className="text-sm font-medium">
            {t("endsOn")}
          </label>
          <div className="flex gap-2">
            <DatePicker id={ids.to} value={endsOn} min={startsOn ?? undefined} onChange={setEndsOn} />
            {endsOn ? (
              <Button type="button" variant="ghost" className="min-h-11 md:min-h-8" onClick={() => setEndsOn(null)}>
                {t("clearEnd")}
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{t("endsOnHint")}</p>
        </div>
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">{t("scope")}</legend>
        <div className="flex flex-wrap gap-4">
          {(["days", "lessons"] as const).map((value) => (
            <label key={value} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
              <input
                type="radio"
                name="excuse-scope"
                value={value}
                checked={scope === value}
                onChange={() => setScope(value)}
              />
              {t(value === "days" ? "scopeDays" : "scopeLessons")}
            </label>
          ))}
        </div>
      </fieldset>
      {scope === "lessons" && startsOn ? (
        <ExcuseLessonPicker
          groupId={group.id}
          from={startsOn}
          to={endsOn ?? startsOn}
          selected={lessonIds}
          onChange={setLessonIds}
        />
      ) : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.reason} className="text-sm font-medium">
          {t("reason")}
        </label>
        <Textarea id={ids.reason} value={reason} maxLength={2000} onChange={(event) => setReason(event.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t("documents")}</span>
        <FileUploadButton
          purpose="feedback"
          multiple
          variant="outline"
          onUploaded={(file) => setFiles((current) => [...current, { id: file.id, name: file.name }].slice(0, 10))}
        />
        {files.length > 0 ? (
          <ul className="flex flex-wrap gap-2 text-sm">
            {files.map((file) => (
              <li key={file.id} className="rounded-lg border px-2 py-1">
                {file.name}
              </li>
            ))}
          </ul>
        ) : null}
        {submitted && missingDocument ? (
          <p role="alert" className="text-sm text-destructive">
            {t("documentRequired")}
          </p>
        ) : null}
      </div>
      <LoadingButton type="submit" loading={create.isPending} className="min-h-11 self-end md:min-h-8">
        {t("submit")}
      </LoadingButton>
    </form>
  )
}
