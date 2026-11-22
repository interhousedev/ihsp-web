"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, cn } from "@ihsp/ui"
import { useId, useState } from "react"
import { filterStudyGroups, studyFieldLabel } from "../../chooser/components/study-field-select"
import { useStudyFields } from "../../chooser/hooks"
import type { FactSpecItem } from "../api"
import {
  EMPTY_DEADLINE,
  EMPTY_FOCUS,
  EMPTY_RANKING,
  EXPERIENCE_PARTS,
  PLANS,
  RANK_SYSTEMS,
  RANKING_SUBJECTS,
  isUsdFact,
  type DeadlineDraft,
  type Draft,
  type FocusDraft,
  type RankingDraft,
} from "../fact-draft"

const IMPORTANCE = ["very_important", "important", "considered", "not_considered"] as const

type FieldProps<T extends Draft> = { item: FactSpecItem; draft: T; onChange: (draft: T) => void }

const TRIGGER = "min-h-11 w-full md:min-h-8"

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const t = useT("catalogFacts")
  return (
    <Select value={value || null} onValueChange={(next) => onChange(next ?? "")}>
      <SelectTrigger aria-label={label} className={TRIGGER}>
        <SelectValue placeholder={t("choose")}>
          {(v: string | null) => options.find((o) => o.value === v)?.label ?? v}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Pill({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-full border px-3 text-sm md:min-h-7 md:px-2.5 md:text-[13px]",
        pressed ? "border-primary bg-primary/10 text-primary font-medium" : "bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  )
}

function BoolField({ item, draft, onChange }: FieldProps<string>) {
  const t = useT("catalogFacts")
  return (
    <div role="group" aria-label={item.label} className="flex flex-wrap gap-1.5">
      {(["yes", "no", ""] as const).map((value) => (
        <Pill key={value || "unknown"} pressed={draft === value} onClick={() => onChange(value)}>
          {t(value === "" ? "unknown" : value)}
        </Pill>
      ))}
    </div>
  )
}

function NumberField({ item, draft, onChange }: FieldProps<string>) {
  const t = useT("catalogFacts")
  const errorId = useId()
  const min = item.min ?? (item.kind === "percent" ? 0 : null)
  const max = item.max ?? (item.kind === "percent" ? 100 : null)
  const text = draft ?? ""
  const value = text.trim() === "" ? null : Number(text.replace(",", "."))
  const outOfRange =
    value !== null && Number.isFinite(value) && ((min !== null && value < min) || (max !== null && value > max))
  return (
    <>
      <Input
        type="number"
        inputMode="decimal"
        aria-label={item.label}
        aria-invalid={outOfRange || undefined}
        aria-describedby={outOfRange ? errorId : undefined}
        min={min ?? undefined}
        max={max ?? undefined}
        step={item.step ?? "any"}
        value={text}
        onChange={(event) => onChange(event.target.value)}
      />
      {outOfRange && (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {t("rangeError", { min: min ?? "", max: max ?? "" })}
        </p>
      )}
    </>
  )
}

function MoneyField({ item, draft, onChange }: FieldProps<Record<string, string>>) {
  const t = useT("catalogFacts")
  const usd = isUsdFact(item)
  return (
    <div className="flex gap-2">
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        aria-label={t("amount", { label: item.label })}
        value={draft.amount ?? ""}
        onChange={(event) => onChange({ ...draft, amount: event.target.value })}
      />
      <Input
        aria-label={t("currency", { label: item.label })}
        className="w-24"
        maxLength={3}
        readOnly={usd}
        value={usd ? "USD" : (draft.currency ?? "")}
        placeholder="USD"
        onChange={(event) => onChange({ ...draft, currency: event.target.value.toUpperCase() })}
      />
    </div>
  )
}

function RangeField({ item, draft, onChange }: FieldProps<Record<string, string>>) {
  const t = useT("catalogFacts")
  return (
    <div className="flex gap-2">
      {(["min", "max"] as const).map((end) => (
        <Input
          key={end}
          type="number"
          inputMode="decimal"
          aria-label={t(end, { label: item.label })}
          placeholder={t(end === "min" ? "from" : "to")}
          min={item.min ?? undefined}
          max={item.max ?? undefined}
          step={item.step ?? "any"}
          value={draft[end] ?? ""}
          onChange={(event) => onChange({ ...draft, [end]: event.target.value })}
        />
      ))}
    </div>
  )
}

function ScoresField({ item, draft, onChange }: FieldProps<Record<string, string>>) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {item.parts.map((part) => (
        <label key={part.key} className="text-muted-foreground flex flex-col gap-1 text-xs">
          {part.label}
          <Input
            type="number"
            inputMode="decimal"
            aria-label={`${item.label}: ${part.label}`}
            min={part.min ?? undefined}
            max={part.max ?? undefined}
            step={part.step ?? "any"}
            value={draft[part.key] ?? ""}
            onChange={(event) => onChange({ ...draft, [part.key]: event.target.value })}
          />
        </label>
      ))}
    </div>
  )
}

function FactorsField({ item, draft, onChange }: FieldProps<Record<string, string>>) {
  const t = useT("catalogFacts")
  const levels = IMPORTANCE.map((value) => ({ value, label: t(`importance.${value}`) }))
  return (
    <div className="flex flex-col gap-1.5">
      {item.parts.map((part) => (
        <div key={part.key} className="grid grid-cols-[1fr_auto] items-center gap-2">
          <span className="text-sm">{part.label}</span>
          <div className="w-40">
            <Choice
              label={`${item.label}: ${part.label}`}
              value={draft[part.key] ?? ""}
              options={levels}
              onChange={(value) => onChange({ ...draft, [part.key]: value })}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function MultiField({ item, draft, onChange }: FieldProps<string[]>) {
  return (
    <div role="group" aria-label={item.label} className="flex flex-wrap gap-1.5">
      {item.options.map((option) => {
        const on = draft.includes(option.value)
        return (
          <Pill
            key={option.value}
            pressed={on}
            onClick={() => onChange(on ? draft.filter((v) => v !== option.value) : [...draft, option.value])}
          >
            {option.label}
          </Pill>
        )
      })}
    </div>
  )
}

function StudyFieldsField({ item, draft, onChange }: FieldProps<string[]>) {
  const t = useT("catalogFacts")
  const { groups } = useStudyFields()
  const [q, setQ] = useState("")
  const shown = filterStudyGroups(groups, q)
    .flatMap((group) => group.items)
    .filter((entry) => !draft.includes(entry.id))
    .slice(0, 12)
  return (
    <div className="flex flex-col gap-2">
      {draft.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {draft.map((id) => (
            <li key={id}>
              <button
                type="button"
                className="bg-primary/10 text-primary flex min-h-9 items-center gap-1 rounded-full px-3 text-sm md:min-h-7 md:px-2.5"
                aria-label={t("removeField", { name: studyFieldLabel(groups, id) ?? id })}
                onClick={() => onChange(draft.filter((v) => v !== id))}
              >
                {studyFieldLabel(groups, id) ?? id}
                <Icons.close className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input aria-label={item.label} placeholder={t("searchFields")} value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="flex flex-wrap gap-1.5">
        {shown.map((entry) => (
          <li key={entry.id}>
            <Pill pressed={false} onClick={() => onChange([...draft, entry.id])}>
              {entry.label}
            </Pill>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DeadlinesField({ item, draft, onChange }: FieldProps<DeadlineDraft[]>) {
  const t = useT("catalogFacts")
  const update = (index: number, patch: Partial<DeadlineDraft>) =>
    onChange(draft.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  const plans = PLANS.map((value) => ({ value, label: value }))
  const binding = [
    { value: "yes", label: t("binding") },
    { value: "no", label: t("nonBinding") },
  ]
  return (
    <div className="flex flex-col gap-2">
      {draft.map((row, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-card border p-2">
          <div className="grid grid-cols-2 gap-2">
            <Choice
              label={t("deadlinePlan")}
              value={row.plan}
              options={plans}
              onChange={(plan) => update(index, { plan })}
            />
            <Input
              type="date"
              aria-label={t("deadlineDate")}
              value={row.date ?? ""}
              onChange={(e) => update(index, { date: e.target.value })}
            />
            <Input
              aria-label={t("deadlineCycle")}
              placeholder="2026-27"
              pattern="\d{4}-\d{2}"
              maxLength={7}
              value={row.cycle ?? ""}
              onChange={(e) => update(index, { cycle: e.target.value })}
            />
            <Choice
              label={t("deadlineBinding")}
              value={row.binding}
              options={binding}
              onChange={(value) => update(index, { binding: value as DeadlineDraft["binding"] })}
            />
            <Input
              aria-label={t("deadlineZone")}
              placeholder="America/New_York"
              maxLength={64}
              value={row.time_zone ?? ""}
              onChange={(e) => update(index, { time_zone: e.target.value })}
            />
            <Input
              aria-label={t("deadlineNote")}
              placeholder={t("deadlineNote")}
              maxLength={200}
              value={row.note ?? ""}
              onChange={(e) => update(index, { note: e.target.value })}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-end"
            onClick={() => onChange(draft.filter((_, i) => i !== index))}
          >
            <Icons.trash className="size-4" aria-hidden />
            {t("deadlineRemove")}
          </Button>
        </div>
      ))}
      {draft.length < 12 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          aria-label={t("deadlineAddFor", { label: item.label })}
          onClick={() => onChange([...draft, { ...EMPTY_DEADLINE }])}
        >
          <Icons.add className="size-4" aria-hidden />
          {t("deadlineAdd")}
        </Button>
      )}
    </div>
  )
}

function RankingsField({ item, draft, onChange }: FieldProps<RankingDraft[]>) {
  const t = useT("catalogFacts")
  const subjects = useT("discover")
  const update = (index: number, patch: Partial<RankingDraft>) =>
    onChange(draft.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  const systems = RANK_SYSTEMS.map((value) => ({ value, label: value.toUpperCase() }))
  const subjectOptions = RANKING_SUBJECTS.map((value) => ({ value, label: subjects(`extras.subjects.${value}`) }))
  return (
    <div className="flex flex-col gap-2">
      {draft.map((row, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-card border p-2">
          <div className="grid grid-cols-2 gap-2">
            <Choice
              label={t("rankingSystem")}
              value={row.system}
              options={systems}
              onChange={(system) => update(index, { system })}
            />
            <Choice
              label={t("rankingSubject")}
              value={row.subject}
              options={subjectOptions}
              onChange={(subject) => update(index, { subject })}
            />
            <Input
              aria-label={t("rankingRank")}
              placeholder={t("rankingRank")}
              maxLength={9}
              value={row.rank}
              onChange={(e) => update(index, { rank: e.target.value })}
            />
            <Input
              type="number"
              inputMode="numeric"
              aria-label={t("rankingYear")}
              placeholder={t("rankingYear")}
              min={2000}
              max={2100}
              value={row.year}
              onChange={(e) => update(index, { year: e.target.value })}
            />
          </div>
          <Input
            type="url"
            aria-label={t("rankingSource")}
            placeholder="https://"
            maxLength={2000}
            value={row.source_url}
            onChange={(e) => update(index, { source_url: e.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-end"
            onClick={() => onChange(draft.filter((_, i) => i !== index))}
          >
            <Icons.trash className="size-4" aria-hidden />
            {t("deadlineRemove")}
          </Button>
        </div>
      ))}
      {draft.length < 40 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          aria-label={t("rankingAddFor", { label: item.label })}
          onClick={() => onChange([...draft, { ...EMPTY_RANKING }])}
        >
          <Icons.add className="size-4" aria-hidden />
          {t("rankingAdd")}
        </Button>
      )}
    </div>
  )
}

function FocusesField({ item, draft, onChange }: FieldProps<FocusDraft[]>) {
  const t = useT("catalogFacts")
  const update = (index: number, patch: Partial<FocusDraft>) =>
    onChange(draft.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  return (
    <div className="flex flex-col gap-2">
      {draft.map((row, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-card border p-2">
          {(["en", "ru", "uz"] as const).map((lang) => (
            <Input
              key={lang}
              aria-label={t("focusText", { lang })}
              placeholder={t("focusText", { lang })}
              maxLength={300}
              value={row[lang]}
              onChange={(e) => update(index, { [lang]: e.target.value })}
            />
          ))}
          <Input
            aria-label={t("focusQuote")}
            placeholder={t("focusQuote")}
            maxLength={300}
            value={row.quote}
            onChange={(e) => update(index, { quote: e.target.value })}
          />
          <Input
            type="url"
            aria-label={t("focusSource")}
            placeholder="https://"
            maxLength={2000}
            value={row.source_url}
            onChange={(e) => update(index, { source_url: e.target.value })}
          />
          <Input
            aria-label={t("focusFetched")}
            placeholder={t("focusFetched")}
            maxLength={32}
            value={row.fetched_at}
            onChange={(e) => update(index, { fetched_at: e.target.value })}
          />
          <Pill pressed={row.verified} onClick={() => update(index, { verified: !row.verified })}>
            {t("focusVerified")}
          </Pill>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-end"
            onClick={() => onChange(draft.filter((_, i) => i !== index))}
          >
            <Icons.trash className="size-4" aria-hidden />
            {t("deadlineRemove")}
          </Button>
        </div>
      ))}
      {draft.length < 12 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          aria-label={t("focusAddFor", { label: item.label })}
          onClick={() => onChange([...draft, { ...EMPTY_FOCUS }])}
        >
          <Icons.add className="size-4" aria-hidden />
          {t("focusAdd")}
        </Button>
      )}
    </div>
  )
}

function ExperienceField({ item, draft, onChange }: FieldProps<Record<string, string>>) {
  const t = useT("catalogFacts")
  const scores = ["", "1", "2", "3", "4", "5"].map((value) => ({ value, label: value || t("unknown") }))
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {EXPERIENCE_PARTS.map((part) => (
        <Choice
          key={part}
          label={`${item.label}: ${t(`experience.${part}`)}`}
          value={draft[part] ?? ""}
          options={scores.slice(1)}
          onChange={(value) => onChange({ ...draft, [part]: value })}
        />
      ))}
    </div>
  )
}

/** The input of one fact; the kind of the spec picks the control and the draft shape. */
export function FactField({ item, draft, onChange }: FieldProps<Draft>) {
  switch (item.kind) {
    case "bool":
      return <BoolField item={item} draft={draft as string} onChange={onChange} />
    case "int":
    case "percent":
      return <NumberField item={item} draft={draft as string} onChange={onChange} />
    case "money":
      return <MoneyField item={item} draft={draft as Record<string, string>} onChange={onChange} />
    case "range":
      return <RangeField item={item} draft={draft as Record<string, string>} onChange={onChange} />
    case "scores":
      return <ScoresField item={item} draft={draft as Record<string, string>} onChange={onChange} />
    case "factors":
      return <FactorsField item={item} draft={draft as Record<string, string>} onChange={onChange} />
    case "multi":
      return <MultiField item={item} draft={draft as string[]} onChange={onChange} />
    case "study_fields":
      return <StudyFieldsField item={item} draft={draft as string[]} onChange={onChange} />
    case "deadlines":
      return <DeadlinesField item={item} draft={draft as DeadlineDraft[]} onChange={onChange} />
    case "rankings":
      return <RankingsField item={item} draft={draft as RankingDraft[]} onChange={onChange} />
    case "focuses":
      return <FocusesField item={item} draft={draft as FocusDraft[]} onChange={onChange} />
    case "experience_scores":
      return <ExperienceField item={item} draft={draft as Record<string, string>} onChange={onChange} />
    case "url":
      return (
        <Input
          type="url"
          aria-label={item.label}
          placeholder="https://"
          maxLength={2000}
          value={(draft as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case "date":
      return (
        <Input
          type="date"
          aria-label={item.label}
          value={(draft as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case "enum":
      return <Choice label={item.label} value={draft as string} options={item.options} onChange={onChange} />
    default:
      return (
        <Input
          aria-label={item.label}
          maxLength={300}
          value={(draft as string | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}
