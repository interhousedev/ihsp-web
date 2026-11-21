"use client"

import { useSchoolGrades } from "../../../lib/config"
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
import { RichTextEditor } from "@ihsp/features-core/rich-text"
import { useState, type FormEvent } from "react"
import { StudyFieldsField } from "./study-fields-field"
import { NotInList } from "./not-in-list"
import { detailHref } from "./scholarship-card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  localName,
  useOrgs,
  useSubmitOpportunity,
  useTaxonomy,
  type AwardType,
  type CreditKind,
  type Opportunity,
  type OpportunityKind,
  type Scope,
} from "../api"

type Coverage = NonNullable<Opportunity["fields"]["coverage"]>[number]
const KINDS: OpportunityKind[] = ["exam", "certification", "course", "scholarship", "research", "event", "recurring"]
const AWARDS: AwardType[] = ["scholarship", "fellowship", "grant", "tuition_waiver", "program"]
const SCOPES: Scope[] = ["local", "international"]
const COVERAGES: Coverage[] = ["full_tuition", "partial_tuition", "stipend", "cash", "travel"]
const CREDITS: CreditKind[] = ["none", "possible", "yes"]

function NativeSelect<T extends string>({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: T | ""
  onChange: (value: T | "") => void
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <select
        className="border-input bg-background h-10 rounded-md border px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value as T | "")}
      >
        {children}
      </select>
    </label>
  )
}

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
  const GRADES = useSchoolGrades()
  const locale = useLocale()
  const router = useRouter()
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
  const [studyFields, setStudyFields] = useState<string[]>(base?.study_field_ids ?? [])
  const [grades, setGrades] = useState<number[]>(base?.grades ?? [])
  const [registration, setRegistration] = useState(base?.registration_deadlines?.[0] ?? "")
  const [exam, setExam] = useState(base?.exam_dates?.[0] ?? "")
  const [lastYear, setLastYear] = useState(base?.last_year_dates?.[0] ?? "")
  const [recurrence, setRecurrence] = useState(base?.recurrence ?? "")
  const [cost, setCost] = useState(base?.tuition_usd?.toString() ?? "")
  const [hours, setHours] = useState(base?.hours_per_week?.toString() ?? "")
  const [startsOn, setStartsOn] = useState(base?.starts_on ?? "")
  const [note, setNote] = useState("")
  const orgs = useOrgs()
  const [orgId, setOrgId] = useState(base?.org_id ?? "")
  const [awardType, setAwardType] = useState<AwardType | "">(base?.award_type ?? "")
  const [scope, setScope] = useState<Scope | "">(base?.scope ?? "")
  const [coverage, setCoverage] = useState<Coverage[]>(base?.coverage ?? [])
  const [amountText, setAmountText] = useState(base?.amount_text ?? "")
  const [essay, setEssay] = useState(base?.essay_required ?? false)
  const [eligibility, setEligibility] = useState(base?.eligibility ?? "")
  const [sourceUrl, setSourceUrl] = useState(base?.source_url ?? "")
  const [credit, setCredit] = useState<CreditKind>(base?.college_credit ?? "none")
  const [creditNote, setCreditNote] = useState(base?.credit_note ?? "")
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
          study_field_ids: studyFields,
          grades: [...grades].sort(),
          registration_deadlines: one(registration),
          exam_dates: one(exam),
          last_year_dates: one(lastYear),
          tuition_usd: cost.trim() === "" ? null : Math.max(0, Math.round(Number(cost))),
          hours_per_week: hours.trim() === "" ? null : Number(hours),
          starts_on: startsOn || null,
          recurrence: kind === "recurring" ? recurrence.trim() || null : null,
          lms_course_id: base?.lms_course_id ?? null,
          materials: base?.materials ?? [],
          org_id: kind === "scholarship" ? orgId || null : null,
          award_type: kind === "scholarship" ? awardType || null : null,
          scope: kind === "scholarship" ? scope || null : null,
          coverage: kind === "scholarship" ? coverage : [],
          amount_text: kind === "scholarship" ? amountText.trim() || null : null,
          essay_required: kind === "scholarship" && essay,
          eligibility: kind === "scholarship" ? eligibility.trim() || null : null,
          source_url: kind === "scholarship" ? sourceUrl.trim() || null : null,
          college_credit: kind === "scholarship" || kind === "course" ? credit : "none",
          credit_note: kind === "scholarship" || kind === "course" ? creditNote.trim() || null : null,
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
        {!target && (
          <NotInList
            onPick={(id) => {
              onOpenChange(false)
              router.push(detailHref(id))
            }}
            onPropose={(d) => {
              if (KINDS.includes(d.kind as OpportunityKind)) setKind(d.kind as OpportunityKind)
              setTitle(d.title)
              setSummary(d.summary)
              setUrl(d.url)
              setProvider(d.provider)
              setSubjects(d.subject_ids)
              setRegistration(d.registration_deadlines[0] ?? "")
              setExam(d.event_dates[0] ?? "")
              setRecurrence(d.recurrence)
            }}
          />
        )}
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
        <div className="flex flex-col gap-1 text-sm">
          {t("summaryLabel")}
          <RichTextEditor
            value={summary}
            onChange={setSummary}
            ariaLabel={t("summaryLabel")}
            maxLength={2000}
            minHeight="8rem"
          />
        </div>
        <StudyFieldsField value={studyFields} onChange={setStudyFields} />
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
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            {t("startsOnLabel")}
            <Input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("hoursLabel")}
            <Input
              type="number"
              min={0.5}
              max={80}
              step={0.5}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("costLabel")}
            <Input type="number" min={0} step={1} value={cost} onChange={(e) => setCost(e.target.value)} />
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
        {kind === "scholarship" && (
          <fieldset className="flex flex-col gap-3 text-sm">
            <legend className="sr-only">{t("scholarships.title")}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <NativeSelect label={t("scholarships.orgLabel")} value={orgId} onChange={setOrgId}>
                <option value="">{t("any")}</option>
                {orgs.data?.items.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect label={t("scholarships.awardLabel")} value={awardType} onChange={setAwardType}>
                <option value="">{t("any")}</option>
                {AWARDS.map((a) => (
                  <option key={a} value={a}>
                    {t(`award.${a}`)}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect label={t("scholarships.scopeLabel")} value={scope} onChange={setScope}>
                <option value="">{t("any")}</option>
                {SCOPES.map((s) => (
                  <option key={s} value={s}>
                    {t(`scope.${s}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-wrap gap-1" role="group" aria-label={t("scholarships.coverageLabel")}>
              {COVERAGES.map((c) => (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={coverage.includes(c) ? "default" : "outline"}
                  aria-pressed={coverage.includes(c)}
                  onClick={() => setCoverage(toggle(coverage, c))}
                >
                  {t(`coverage.${c}`)}
                </Button>
              ))}
            </div>
            <label className="flex flex-col gap-1">
              {t("scholarships.amountLabel")}
              <Input value={amountText} onChange={(e) => setAmountText(e.target.value)} maxLength={200} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={essay} onChange={(e) => setEssay(e.target.checked)} />
              {t("scholarships.essay")}
            </label>
            <label className="flex flex-col gap-1">
              {t("scholarships.eligibilityLabel")}
              <Textarea value={eligibility} onChange={(e) => setEligibility(e.target.value)} maxLength={2000} />
            </label>
            <label className="flex flex-col gap-1">
              {t("scholarships.sourceLabel")}
              <Input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
            </label>
          </fieldset>
        )}
        {(kind === "scholarship" || kind === "course") && (
          <div className="grid gap-3 sm:grid-cols-2">
            <NativeSelect label={t("scholarships.creditLabel")} value={credit} onChange={(v) => setCredit(v || "none")}>
              {CREDITS.map((c) => (
                <option key={c} value={c}>
                  {t(`credit.${c}`)}
                </option>
              ))}
            </NativeSelect>
            <label className="flex flex-col gap-1 text-sm">
              {t("scholarships.creditNoteLabel")}
              <Input value={creditNote} onChange={(e) => setCreditNote(e.target.value)} maxLength={500} />
            </label>
          </div>
        )}
        <label className="flex flex-col gap-1 text-sm">
          {t("noteLabel")}
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        </label>
      </div>
    </ResponsiveDialog>
  )
}
