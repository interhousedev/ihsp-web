"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, LoadingButton, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"
import {
  clearProblemToast,
  fieldCopy,
  fieldMessage,
  problemField,
  showProblemToast,
  type FieldProblem,
} from "../../../lib/problem-fields"
import { useUploadDocument } from "../../documents/api"
import {
  SCORE_STATUSES,
  scoreName,
  useSaveScore,
  type ScoreEntry,
  type ScoreEntryInput,
  type ScoreSection,
  type ScoreStatus,
  type ScoreTest,
} from "../api"

const SELECT = "border-input bg-background h-11 rounded-md border px-3 text-sm md:h-9"
const CERTIFICATE_KIND = "test_report"

type Values = Record<string, string>

function initial(entry: ScoreEntry | undefined): Values {
  return Object.fromEntries(Object.entries(entry?.sections ?? {}).map(([key, value]) => [key, String(value)]))
}

/** The value sent for one section: a number for ranges, the chosen text for choices. */
function parsed(section: ScoreSection, raw: string): number | string {
  return (section.choices?.length ?? 0) > 0 ? raw : Number(raw)
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? (
    <p role="alert" className="text-destructive text-xs">
      {message}
    </p>
  ) : null
}

function SectionField({
  section,
  value,
  onChange,
  idPrefix,
  error,
}: {
  section: ScoreSection
  value: string
  onChange: (value: string) => void
  idPrefix: string
  error?: string
}) {
  const t = useT("testScores")
  const locale = useLocale()
  const id = `${idPrefix}-${section.key}`
  const name = scoreName(section.names, locale)
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{name}</Label>
      {(section.choices?.length ?? 0) > 0 ? (
        <select id={id} className={SELECT} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{t("choose")}</option>
          {(section.choices ?? []).map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      ) : (
        <Input
          className="h-11 md:h-8"
          id={id}
          type="number"
          inputMode="decimal"
          min={section.min}
          max={section.max}
          step={section.step}
          placeholder={`${section.min}–${section.max}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <FieldError message={error} />
    </div>
  )
}

/** Adds or edits an entry; the inputs follow the chosen test's sections, ranges and steps. */
export function ScoreDialog({
  open,
  onOpenChange,
  tests,
  entry,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tests: ScoreTest[]
  entry?: ScoreEntry
}) {
  const t = useT("testScores")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const save = useSaveScore()
  const upload = useUploadDocument()
  const [testId, setTestId] = useState(entry?.test_id ?? "")
  const [status, setStatus] = useState<ScoreStatus>((entry?.status as ScoreStatus | undefined) ?? "planned")
  const [testDate, setTestDate] = useState(entry?.test_date ?? "")
  const [deadline, setDeadline] = useState(entry?.registration_deadline ?? "")
  const [label, setLabel] = useState(entry?.label ?? "")
  const [level, setLevel] = useState(entry?.level ?? "")
  const [values, setValues] = useState<Values>(initial(entry))
  const [total, setTotal] = useState(entry?.total == null ? "" : String(entry.total))
  const [url, setUrl] = useState(entry?.verification_url ?? "")
  const [note, setNote] = useState(entry?.send_note ?? "")
  const [official, setOfficial] = useState(entry?.is_official ?? false)
  const [documentId, setDocumentId] = useState(entry?.certificate_document_id ?? null)
  const [fileName, setFileName] = useState("")
  const fileInput = useRef<HTMLInputElement>(null)
  const test = tests.find((item) => item.id === testId)
  const [pickError, setPickError] = useState(false)
  const [problem, setProblem] = useState<FieldProblem | null>(null)
  const copy = { status: t("problems.status"), verification_url: t("problems.verificationUrl") }
  const handled =
    problem !== null &&
    (["status", "test_date", "registration_deadline", "verification_url", "total"].some(
      (name) => fieldMessage(problem, name) !== undefined,
    ) ||
      (test?.sections ?? []).some((s) => fieldMessage(problem, `sections.${s.key}`) !== undefined))

  function pickTest(id: string) {
    setTestId(id)
    setPickError(false)
    setValues({})
    setTotal("")
    setLabel("")
    setLevel("")
  }

  async function attach(file: File | undefined) {
    if (!file) return
    try {
      const doc = await upload.mutateAsync({ kind: CERTIFICATE_KIND, file })
      setDocumentId(doc.id)
      setFileName(file.name)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    if (!test) {
      setPickError(true)
      return
    }
    const sections: Record<string, number | string> = {}
    for (const section of test.sections) {
      const raw = values[section.key]
      if (raw !== undefined && raw !== "") sections[section.key] = parsed(section, raw)
    }
    const input: ScoreEntryInput = {
      test_id: test.id,
      status,
      test_date: testDate || null,
      registration_deadline: deadline || null,
      label: test.needs_label ? label.trim() || null : null,
      level: test.needs_level ? level.trim() || null : null,
      sections,
      total: test.total_mode === "manual" && test.total && total !== "" ? parsed(test.total, total) : null,
      certificate_document_id: documentId,
      verification_url: url.trim() || null,
      send_note: note.trim() || null,
      is_official: official,
    }
    try {
      await save.mutateAsync({ id: entry?.id, input })
      clearProblemToast()
      setProblem(null)
      toast.success(t("saved"))
      onOpenChange(false)
    } catch (error) {
      const found = problemField(error)
      setProblem(found)
      if (!found) showProblemToast(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={entry ? t("editTitle") : t("addTitle")}
      onSubmit={send}
      footer={
        <LoadingButton type="submit" loading={save.isPending}>
          {t("save")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="score-test">{t("test")}</Label>
          <select
            id="score-test"
            className={SELECT}
            value={testId}
            disabled={entry !== undefined}
            onChange={(e) => pickTest(e.target.value)}
          >
            <option value="">{t("choose")}</option>
            {tests.map((item) => (
              <option key={item.id} value={item.id}>
                {scoreName(item.names, locale)}
              </option>
            ))}
          </select>
          <FieldError message={pickError ? t("problems.pickTest") : undefined} />
        </div>
        {problem && !handled ? <FieldError message={problem.title} /> : null}
        {test ? (
          <>
            <div className="flex flex-col gap-1">
              <Label htmlFor="score-status">{t("status")}</Label>
              <select
                id="score-status"
                className={SELECT}
                value={status}
                onChange={(e) => setStatus(e.target.value as ScoreStatus)}
              >
                {SCORE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {t(`statusValue.${value}`)}
                  </option>
                ))}
              </select>
              <FieldError message={fieldCopy(problem, copy, "status")} />
            </div>
            {test.needs_label ? (
              <div className="flex flex-col gap-1">
                <Label htmlFor="score-label">{t("label")}</Label>
                <Input
                  className="h-11 md:h-8"
                  id="score-label"
                  value={label}
                  maxLength={120}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            ) : null}
            {test.needs_level ? (
              <div className="flex flex-col gap-1">
                <Label htmlFor="score-level">{t("level")}</Label>
                <Input
                  className="h-11 md:h-8"
                  id="score-level"
                  value={level}
                  maxLength={60}
                  onChange={(e) => setLevel(e.target.value)}
                />
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="score-deadline">{t("registrationDeadline")}</Label>
                <Input
                  className="h-11 md:h-8"
                  id="score-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
                <FieldError message={fieldMessage(problem, "registration_deadline")} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="score-date">{t("testDate")}</Label>
                <Input
                  className="h-11 md:h-8"
                  id="score-date"
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                />
                <FieldError message={fieldMessage(problem, "test_date")} />
              </div>
            </div>
            {test.sections.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {test.sections.map((section) => (
                  <SectionField
                    key={section.key}
                    idPrefix="score-section"
                    section={section}
                    value={values[section.key] ?? ""}
                    onChange={(value) => setValues((prev) => ({ ...prev, [section.key]: value }))}
                    error={fieldMessage(problem, `sections.${section.key}`)}
                  />
                ))}
              </div>
            ) : null}
            {test.total_mode === "manual" && test.total ? (
              <SectionField
                section={test.total}
                idPrefix="score-total"
                value={total}
                onChange={setTotal}
                error={fieldMessage(problem, "total")}
              />
            ) : test.total_mode !== "none" ? (
              <p className="text-muted-foreground text-xs">{t("totalComputed")}</p>
            ) : null}
            <div className="flex flex-col gap-1">
              <Label htmlFor="score-certificate">{t("certificate")}</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={upload.isPending}
                  onClick={() => fileInput.current?.click()}
                >
                  <span className="flex items-center gap-1">
                    <Icons.upload aria-hidden />
                    {upload.isPending ? t("uploading") : documentId ? t("replaceCertificate") : t("uploadCertificate")}
                  </span>
                </Button>
                <input
                  ref={fileInput}
                  id="score-certificate"
                  type="file"
                  className="sr-only"
                  accept="application/pdf,image/*"
                  onChange={(e) => void attach(e.target.files?.[0])}
                />
                {documentId ? (
                  <span className="text-muted-foreground text-xs">{fileName || t("certificateAttached")}</span>
                ) : null}
                {documentId ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDocumentId(null)}>
                    {t("removeCertificate")}
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="score-url">{t("verificationUrl")}</Label>
              <Input
                className="h-11 md:h-8"
                id="score-url"
                type="url"
                value={url}
                maxLength={500}
                onChange={(e) => setUrl(e.target.value)}
              />
              <FieldError message={fieldCopy(problem, copy, "verification_url")} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="score-note">{t("sendNote")}</Label>
              <Textarea id="score-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={official} onChange={(e) => setOfficial(e.target.checked)} />
              {t("official")}
            </label>
          </>
        ) : null}
      </div>
    </ResponsiveDialog>
  )
}
