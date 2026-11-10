"use client"

import type { ExcuseRequestBody, FileItem } from "@ihsp/api"
import { FileUploadButton, QueryState } from "@ihsp/features-core"
import { getMeExcuseTemplatesQuery } from "@ihsp/api"
import { todayIso, useErrorMessage, useLocale, useT, type IsoDate } from "@ihsp/i18n"
import { Button, DatePicker, Dropdown, Label, Textarea } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useId, useState, type FormEvent } from "react"
import { z } from "zod"
import { useCreateExcuse } from "../api/use-excuse-mutations"
import { templateTitle } from "../utils/excuse-labels"
import { ExcuseLessonPicker } from "./excuse-lesson-picker"

const REASON_MAX = 2000
const FILES_MAX = 10

const formSchema = z.object({
  templateId: z.string().min(1),
  startsOn: z.string().min(1),
  endsOn: z.string().nullable(),
  reason: z.string().max(REASON_MAX),
})

type FormError = "template" | "dates" | "document" | null

/** The request form: reason template, dates (the end is optional), lessons, a note and the document. */
export function ExcuseRequestForm({ onDone, onCancel }: { onDone: (id: string) => void; onCancel: () => void }) {
  const t = useT("excuses")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const ids = useId()
  const templates = useQuery(getMeExcuseTemplatesQuery())
  const create = useCreateExcuse()
  const [templateId, setTemplateId] = useState("")
  const [startsOn, setStartsOn] = useState<IsoDate>(todayIso())
  const [endsOn, setEndsOn] = useState<IsoDate | null>(null)
  const [lessonIds, setLessonIds] = useState<string[]>([])
  const [reason, setReason] = useState("")
  const [files, setFiles] = useState<FileItem[]>([])
  const [formError, setFormError] = useState<FormError>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (create.isPending) return
    const template = templates.data?.items.find((item) => item.id === templateId)
    const parsed = formSchema.safeParse({ templateId, startsOn, endsOn, reason: reason.trim() })
    if (!parsed.success || !template) return setFormError("template")
    if (endsOn && endsOn < startsOn) return setFormError("dates")
    if (template.requires_document && files.length === 0) return setFormError("document")
    setFormError(null)
    const body: ExcuseRequestBody = {
      template_id: template.id,
      starts_on: startsOn,
      ends_on: endsOn,
      lesson_ids: lessonIds,
      reason: parsed.data.reason,
      file_ids: files.map((file) => file.id),
    }
    create.mutate(body, { onSuccess: (excuse) => onDone(excuse.id) })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <QueryState query={templates} rows={1}>
        {(data) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${ids}-template`}>{t("form.template")}</Label>
            <Dropdown
              id={`${ids}-template`}
              aria-label={t("form.template")}
              placeholder={t("form.templatePlaceholder")}
              value={templateId}
              onValueChange={setTemplateId}
              options={data.items.map((item) => ({
                value: item.id,
                label: templateTitle(item, locale),
              }))}
            />
            {data.items.find((item) => item.id === templateId)?.requires_document ? (
              <p className="text-muted-foreground text-xs">{t("form.documentHint")}</p>
            ) : null}
          </div>
        )}
      </QueryState>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${ids}-from`}>{t("form.startsOn")}</Label>
          <DatePicker
            id={`${ids}-from`}
            value={startsOn}
            onChange={(date) => {
              if (date) setStartsOn(date)
              setLessonIds([])
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${ids}-to`}>{t("form.endsOn")}</Label>
          <DatePicker
            id={`${ids}-to`}
            value={endsOn}
            min={startsOn}
            placeholder={t("form.endsOnPlaceholder")}
            onChange={(date) => {
              setEndsOn(date)
              setLessonIds([])
            }}
          />
        </div>
      </div>
      <ExcuseLessonPicker from={startsOn} to={endsOn} value={lessonIds} onChange={setLessonIds} />
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${ids}-reason`}>{t("form.reason")}</Label>
        <Textarea
          id={`${ids}-reason`}
          value={reason}
          maxLength={REASON_MAX}
          rows={3}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("form.documents")}</span>
        {files.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {files.map((file) => (
              <li key={file.id} className="flex min-h-11 items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 md:min-h-8"
                  onClick={() => setFiles((rows) => rows.filter((row) => row.id !== file.id))}
                >
                  {t("form.removeFile", { name: file.name })}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <FileUploadButton
          purpose="feedback"
          multiple
          disabled={files.length >= FILES_MAX}
          label={t("form.attach")}
          onUploaded={(file) => setFiles((rows) => [...rows, file])}
        />
      </div>
      {formError ? (
        <p role="alert" className="text-destructive text-sm">
          {t(`form.errors.${formError}`)}
        </p>
      ) : null}
      {create.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(create.error)}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onCancel}>
          {t("form.cancel")}
        </Button>
        <Button type="submit" className="min-h-11 md:min-h-8" disabled={create.isPending}>
          {create.isPending ? t("form.sending") : t("form.submit")}
        </Button>
      </div>
    </form>
  )
}
