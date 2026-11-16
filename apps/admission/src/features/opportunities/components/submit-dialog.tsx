"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Button,
  Input,
  LoadingButton,
  ResponsiveDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { localName, useSubmitOpportunity, useTaxonomy, type Opportunity, type OpportunityKind } from "../api"

const KINDS: OpportunityKind[] = ["exam", "certification", "course", "event", "recurring"]
const GRADES = [9, 10, 11, 12]

/** Every add or edit goes to the moderation queue; `target` makes it an edit of a published entry. */
export function SubmitDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  target?: Opportunity
}) {
  const t = useT("opportunities")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const submit = useSubmitOpportunity()
  const taxonomy = useTaxonomy()
  const base = target?.fields
  const [kind, setKind] = useState<OpportunityKind>(base?.kind ?? "exam")
  const [title, setTitle] = useState(base?.title ?? "")
  const [summary, setSummary] = useState(base?.summary ?? "")
  const [url, setUrl] = useState(base?.url ?? "")
  const [provider, setProvider] = useState(base?.provider ?? "")
  const [subjects, setSubjects] = useState<string[]>(base?.subject_ids ?? [])
  const [grades, setGrades] = useState<number[]>(base?.grades ?? [])
  const [registration, setRegistration] = useState(base?.registration_deadlines?.[0] ?? "")
  const [exam, setExam] = useState(base?.exam_dates?.[0] ?? "")
  const [lastYear, setLastYear] = useState(base?.last_year_dates?.[0] ?? "")
  const [recurrence, setRecurrence] = useState(base?.recurrence ?? "")
  const [note, setNote] = useState("")
  const ready = title.trim() !== "" && subjects.length > 0

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  async function send(event: FormEvent) {
    event.preventDefault()
    const one = (v: string) => (v ? [v] : [])
    try {
      await submit.mutateAsync({
        target_id: target?.id ?? null,
        note: note.trim() || null,
        fields: {
          kind,
          title: title.trim(),
          summary: summary.trim() || null,
          url: url.trim() || null,
          provider: provider.trim() || null,
          subject_ids: subjects,
          grades: [...grades].sort(),
          registration_deadlines: one(registration),
          exam_dates: one(exam),
          last_year_dates: one(lastYear),
          recurrence: kind === "recurring" ? recurrence.trim() || null : null,
          lms_course_id: base?.lms_course_id ?? null,
          materials: base?.materials ?? [],
        },
      })
      toast.success(t("submitted"))
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={target ? t("editTitle") : t("suggestTitle")}
      onSubmit={send}
      footer={
        <LoadingButton type="submit" disabled={!ready} loading={submit.isPending}>
          {t("send")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <Select value={kind} onValueChange={(v) => setKind(v as OpportunityKind)}>
          <SelectTrigger aria-label={t("kindLabel")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {t(`kind.${k}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex flex-col gap-1 text-sm">
          {t("titleLabel")}
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("summaryLabel")}
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={2000} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("urlLabel")}
          <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("providerLabel")}
          <Input value={provider} onChange={(e) => setProvider(e.target.value)} maxLength={300} />
        </label>
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend>{t("subjectsLabel")}</legend>
          <div className="flex flex-wrap gap-1">
            {taxonomy.data?.fields.flatMap((f) =>
              f.subfields.flatMap((s) =>
                s.subjects.map((subject) => (
                  <Button
                    key={subject.id}
                    type="button"
                    size="sm"
                    variant={subjects.includes(subject.id) ? "default" : "outline"}
                    aria-pressed={subjects.includes(subject.id)}
                    onClick={() => setSubjects(toggle(subjects, subject.id))}
                  >
                    {localName(subject.name, locale)}
                  </Button>
                )),
              ),
            )}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend>{t("gradesLabel")}</legend>
          <div className="flex gap-1">
            {GRADES.map((g) => (
              <Button
                key={g}
                type="button"
                size="sm"
                variant={grades.includes(g) ? "default" : "outline"}
                aria-pressed={grades.includes(g)}
                onClick={() => setGrades(toggle(grades, g))}
              >
                {t("gradeShort", { grade: g })}
              </Button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            {t("registrationLabel")}
            <Input type="date" value={registration} onChange={(e) => setRegistration(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("examLabel")}
            <Input type="date" value={exam} onChange={(e) => setExam(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("lastYearLabel")}
            <Input type="date" value={lastYear} onChange={(e) => setLastYear(e.target.value)} />
          </label>
        </div>
        {kind === "recurring" && (
          <label className="flex flex-col gap-1 text-sm">
            {t("recurrenceLabel")}
            <Input
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              placeholder="FREQ=MONTHLY;BYMONTHDAY=15"
            />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm">
          {t("noteLabel")}
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        </label>
      </div>
    </ResponsiveDialog>
  )
}
